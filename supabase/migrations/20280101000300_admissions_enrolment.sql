-- Workstream 3 — Admissions → Students → Enrolment.
--
-- One-gate admissions: entrance exam only, no interviews. An applicant is a
-- `person` (identity spine) plus an `application`. On enrol we create the
-- `student` (auto admission_no) and an `enrolment` row (the per-year placement
-- that gives us class/house history). RLS ships with the tables.

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────
create type public.application_status as enum (
  'submitted',
  'exam_taken',
  'offered',
  'accepted',
  'enrolled',
  'rejected',
  'withdrawn'
);

create type public.enrolment_status as enum (
  'active',
  'withdrawn',
  'graduated',
  'transferred'
);

-- ─────────────────────────────────────────────────────────────────────────
-- application — one per applicant per intake year.
-- ─────────────────────────────────────────────────────────────────────────
create table public.application (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.person (id) on delete restrict,
  academic_year_id uuid references public.academic_year (id) on delete set null,
  stream public.stream,
  track public.track,
  exam_score numeric(5, 2) check (exam_score is null or (exam_score >= 0 and exam_score <= 100)),
  status public.application_status not null default 'submitted',
  submitted_on date not null default current_date,
  decided_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (person_id, academic_year_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- enrolment — per-year placement; keeps class/house history (one per year).
-- ─────────────────────────────────────────────────────────────────────────
create table public.enrolment (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.application (id) on delete set null,
  student_id uuid not null references public.student (id) on delete cascade,
  academic_year_id uuid not null references public.academic_year (id) on delete restrict,
  class_id uuid references public.class (id) on delete set null,
  house_id uuid references public.house (id) on delete set null,
  enrolled_on date not null default current_date,
  status public.enrolment_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (student_id, academic_year_id)
);

create trigger set_updated_at before update on public.application
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.enrolment
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Admission number generation: THS<year>-<4-digit sequence>, e.g. THS2028-0001
-- ─────────────────────────────────────────────────────────────────────────
create sequence if not exists public.admission_no_seq;

create or replace function public.next_admission_no(p_year int)
returns text
language sql
volatile
security definer
set search_path = public
as $$
  select 'THS' || p_year::text || '-' || lpad(nextval('public.admission_no_seq')::text, 4, '0');
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- enrol_applicant — atomic enrolment. Authorized to admin/admissions only.
-- Creates the student (with admission_no), the enrolment row, and flips the
-- application to 'enrolled'. SECURITY DEFINER so it can write across tables;
-- it does its OWN authorization check first.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.enrol_applicant(
  p_application_id uuid,
  p_academic_year_id uuid,
  p_class_id uuid default null,
  p_house_id uuid default null
)
returns table (student_id uuid, admission_no text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.application%rowtype;
  v_student_id uuid;
  v_admission_no text;
  v_year int;
begin
  if not (public.is_admin() or public.has_role('admissions')) then
    raise exception 'not authorized to enrol applicants';
  end if;

  select * into v_app from public.application where id = p_application_id for update;
  if not found then
    raise exception 'application % not found', p_application_id;
  end if;
  if v_app.status = 'enrolled' then
    raise exception 'application % is already enrolled', p_application_id;
  end if;

  select coalesce(extract(year from ay.starts_on), extract(year from now()))::int
    into v_year
  from public.academic_year ay
  where ay.id = p_academic_year_id;
  if v_year is null then
    raise exception 'academic year % not found', p_academic_year_id;
  end if;

  v_admission_no := public.next_admission_no(v_year);

  insert into public.student
    (person_id, admission_no, stream, track, status, enrolled_on, created_by)
  values
    (v_app.person_id, v_admission_no, v_app.stream, v_app.track,
     'enrolled', current_date, auth.uid())
  returning id into v_student_id;

  insert into public.enrolment
    (application_id, student_id, academic_year_id, class_id, house_id, created_by)
  values
    (p_application_id, v_student_id, p_academic_year_id, p_class_id, p_house_id, auth.uid());

  update public.application
     set status = 'enrolled', decided_on = current_date
   where id = p_application_id;

  return query select v_student_id, v_admission_no;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — application + enrolment. Default-deny like everything else.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.application enable row level security;
alter table public.enrolment enable row level security;
revoke all on public.application from anon;
revoke all on public.enrolment from anon;
grant select, insert, update, delete on public.application to authenticated;
grant select, insert, update, delete on public.enrolment to authenticated;

-- application: admissions + admin manage; nobody else sees admissions data.
create policy application_select_admissions on public.application
  for select to authenticated
  using (public.is_admin() or public.has_role('admissions'));

create policy application_insert_admissions on public.application
  for insert to authenticated
  with check (public.is_admin() or public.has_role('admissions'));

create policy application_update_admissions on public.application
  for update to authenticated
  using (public.is_admin() or public.has_role('admissions'))
  with check (public.is_admin() or public.has_role('admissions'));

create policy application_delete_admin on public.application
  for delete to authenticated
  using (public.is_admin());

-- enrolment: admin/admissions manage; all staff may read placements; a parent
-- may read only their own child's enrolment rows.
create policy enrolment_select_staff on public.enrolment
  for select to authenticated
  using (public.is_staff());

create policy enrolment_select_parent on public.enrolment
  for select to authenticated
  using (public.is_parent_of_student(student_id));

create policy enrolment_insert_admissions on public.enrolment
  for insert to authenticated
  with check (public.is_admin() or public.has_role('admissions'));

create policy enrolment_update_admissions on public.enrolment
  for update to authenticated
  using (public.is_admin() or public.has_role('admissions'))
  with check (public.is_admin() or public.has_role('admissions'));

create policy enrolment_delete_admin on public.enrolment
  for delete to authenticated
  using (public.is_admin());

-- The enrol RPC is callable by authenticated; it authorizes internally.
revoke all on function public.enrol_applicant(uuid, uuid, uuid, uuid) from anon;
grant execute on function public.enrol_applicant(uuid, uuid, uuid, uuid) to authenticated;
revoke all on function public.next_admission_no(int) from anon, authenticated;
