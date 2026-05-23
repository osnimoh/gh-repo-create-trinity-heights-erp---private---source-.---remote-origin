-- Workstream 4 — Attendance (+ boarding roll & exeat).
--
-- Teacher attendance is scoped to "own classes only" via is_teacher_of_class().
-- Boarding roll + exeat are boarding-staff territory. Parents may read their own
-- child's marks/rolls/exeats. exeat carries the authorised collector and is kept
-- clean for the security-gate integration by an integrity trigger.

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────
create type public.attendance_status as enum (
  'present', 'absent', 'late', 'excused'
);
create type public.attendance_session_type as enum (
  'morning', 'afternoon', 'prep'
);
create type public.boarding_session as enum ('morning', 'evening');
create type public.exeat_status as enum (
  'requested', 'approved', 'denied', 'departed', 'returned', 'cancelled'
);

-- ─────────────────────────────────────────────────────────────────────────
-- Authorization helpers (staff identity + class ownership)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id
  from public.staff s
  join public.person p on p.id = s.person_id
  where p.auth_user_id = auth.uid();
$$;

-- True when the current user form-teaches or teaches a subject in the class.
create or replace function public.is_teacher_of_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.class c
      where c.id = p_class_id
        and c.form_teacher_staff_id = public.current_staff_id()
    )
    or exists (
      select 1 from public.class_subject cs
      where cs.class_id = p_class_id
        and cs.teacher_staff_id = public.current_staff_id()
    );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────
create table public.attendance_session (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.class (id) on delete cascade,
  session_date date not null default current_date,
  session_type public.attendance_session_type not null default 'morning',
  taken_by_staff_id uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (class_id, session_date, session_type)
);

create table public.attendance_mark (
  id uuid primary key default gen_random_uuid(),
  attendance_session_id uuid not null references public.attendance_session (id) on delete cascade,
  student_id uuid not null references public.student (id) on delete cascade,
  status public.attendance_status not null default 'present',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (attendance_session_id, student_id)
);

create table public.boarding_roll (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student (id) on delete cascade,
  house_id uuid references public.house (id) on delete set null,
  roll_date date not null default current_date,
  session public.boarding_session not null default 'evening',
  present boolean not null default true,
  note text,
  taken_by_staff_id uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (student_id, roll_date, session)
);

create table public.exeat (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student (id) on delete cascade,
  collector_guardian_id uuid references public.guardian (id) on delete set null,
  reason text,
  departure_at timestamptz,
  expected_return_at timestamptz,
  actual_return_at timestamptz,
  status public.exeat_status not null default 'requested',
  approved_by_staff_id uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create index attendance_mark_student_idx on public.attendance_mark (student_id);
create index boarding_roll_student_idx on public.boarding_roll (student_id);
create index exeat_student_idx on public.exeat (student_id);

create trigger set_updated_at before update on public.attendance_session
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.attendance_mark
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.boarding_roll
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.exeat
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Integrity: an exeat's collector MUST be an authorised collector for that
-- student. Keeps exeat data clean for the security-gate interface.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.check_exeat_collector()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.collector_guardian_id is not null then
    if not exists (
      select 1 from public.student_guardian sg
      where sg.student_id = new.student_id
        and sg.guardian_id = new.collector_guardian_id
        and sg.is_authorised_collector = true
    ) then
      raise exception
        'guardian % is not an authorised collector for student %',
        new.collector_guardian_id, new.student_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger exeat_check_collector
  before insert or update on public.exeat
  for each row execute function public.check_exeat_collector();

-- ─────────────────────────────────────────────────────────────────────────
-- save_attendance — upsert a session and its marks atomically. Authorized to
-- admin or the class's teacher. p_marks is a JSON array of
-- { "student_id": uuid, "status": attendance_status }.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.save_attendance(
  p_class_id uuid,
  p_session_date date,
  p_session_type public.attendance_session_type,
  p_marks jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_mark jsonb;
begin
  if not (public.is_admin() or public.is_teacher_of_class(p_class_id)) then
    raise exception 'not authorized to take attendance for this class';
  end if;

  insert into public.attendance_session
    (class_id, session_date, session_type, taken_by_staff_id, created_by)
  values
    (p_class_id, p_session_date, p_session_type, public.current_staff_id(), auth.uid())
  on conflict (class_id, session_date, session_type)
  do update set taken_by_staff_id = public.current_staff_id(), updated_at = now()
  returning id into v_session_id;

  for v_mark in select * from jsonb_array_elements(p_marks)
  loop
    insert into public.attendance_mark
      (attendance_session_id, student_id, status, created_by)
    values
      (v_session_id,
       (v_mark ->> 'student_id')::uuid,
       (v_mark ->> 'status')::public.attendance_status,
       auth.uid())
    on conflict (attendance_session_id, student_id)
    do update set status = excluded.status, updated_at = now();
  end loop;

  return v_session_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — default-deny, then open per role.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'attendance_session', 'attendance_mark', 'boarding_roll', 'exeat'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('revoke all on public.%I from anon;', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end;
$$;

-- attendance_session: admin or the class's teacher.
create policy attendance_session_rw on public.attendance_session
  for all to authenticated
  using (public.is_admin() or public.is_teacher_of_class(class_id))
  with check (public.is_admin() or public.is_teacher_of_class(class_id));

-- attendance_mark: admin or teacher of the mark's session class; a parent may
-- read only their own child's marks.
create policy attendance_mark_select on public.attendance_mark
  for select to authenticated
  using (
    public.is_admin()
    or public.is_parent_of_student(student_id)
    or exists (
      select 1 from public.attendance_session s
      where s.id = attendance_mark.attendance_session_id
        and public.is_teacher_of_class(s.class_id)
    )
  );

create policy attendance_mark_write on public.attendance_mark
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.attendance_session s
      where s.id = attendance_mark.attendance_session_id
        and public.is_teacher_of_class(s.class_id)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.attendance_session s
      where s.id = attendance_mark.attendance_session_id
        and public.is_teacher_of_class(s.class_id)
    )
  );

-- boarding_roll: admin or house staff manage; a parent reads own child.
create policy boarding_roll_select on public.boarding_roll
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('house_staff')
    or public.is_parent_of_student(student_id)
  );

create policy boarding_roll_write on public.boarding_roll
  for all to authenticated
  using (public.is_admin() or public.has_role('house_staff'))
  with check (public.is_admin() or public.has_role('house_staff'));

-- exeat: admin or house staff manage; a parent reads own child.
create policy exeat_select on public.exeat
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('house_staff')
    or public.is_parent_of_student(student_id)
  );

create policy exeat_write on public.exeat
  for all to authenticated
  using (public.is_admin() or public.has_role('house_staff'))
  with check (public.is_admin() or public.has_role('house_staff'));

revoke all on function public.save_attendance(uuid, date, public.attendance_session_type, jsonb) from anon;
grant execute on function public.save_attendance(uuid, date, public.attendance_session_type, jsonb) to authenticated;
