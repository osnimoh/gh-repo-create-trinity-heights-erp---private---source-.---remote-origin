-- Workstream 2 — RLS FOUNDATION (the gate).
--
-- Enables Row-Level Security with DEFAULT-DENY on every table that exists so
-- far (the WS1 identity + academic tables), adds the authorization helper
-- functions the policies depend on, creates the append-only audit_log plus a
-- reusable audit trigger, and writes per-role policies implementing the matrix
-- in CLAUDE.md.
--
-- SCOPE NOTE: the four most-protected tables (payment, result, health_record,
-- safeguarding_flag) do not exist yet — they arrive in WS5/6/7 and MUST ship
-- with their own RLS + audit in those migrations (WS7 re-verifies). The audit
-- machinery here is ready to attach to them.
--
-- MODEL: the app connects as the `authenticated` Postgres role. RLS applies to
-- it. `anon` (logged-out) is revoked from everything. `service_role` has
-- BYPASSRLS and is used only by trusted server code and test fixtures.

-- ─────────────────────────────────────────────────────────────────────────
-- Authorization helpers. All SECURITY DEFINER with a pinned search_path so
-- they read the underlying tables without triggering RLS recursion.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.current_person_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.person where auth_user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin'::public.app_role);
$$;

-- True for any internal staff role (everyone except parent).
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in (
        'admin', 'teacher', 'form_teacher', 'house_staff',
        'bursary', 'nurse', 'dsl', 'admissions'
      )
  );
$$;

-- True when the logged-in user is a guardian of the given student.
create or replace function public.is_parent_of_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_guardian sg
    join public.guardian g on g.id = sg.guardian_id
    where sg.student_id = p_student_id
      and g.person_id = public.current_person_id()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- audit_log — append-only. Writes to protected tables are logged via the
-- trigger below. Reads of protected tables are logged at the data-access
-- layer (dedicated RPCs) in the workstreams that introduce those tables,
-- because Postgres has no SELECT trigger.
-- ─────────────────────────────────────────────────────────────────────────
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid, -- auth.uid() of the actor (null for system)
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
  table_name text not null,
  row_id uuid,
  detail jsonb
);

create index audit_log_table_row_idx on public.audit_log (table_name, row_id);
create index audit_log_occurred_at_idx on public.audit_log (occurred_at);

-- Generic write-audit trigger. Attach to protected tables as they are created:
--   create trigger audit_<table> after insert or update or delete on public.<table>
--     for each row execute function public.audit_row();
create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_id uuid;
begin
  if (tg_op = 'DELETE') then
    v_row_id := old.id;
  else
    v_row_id := new.id;
  end if;

  insert into public.audit_log (actor_user_id, action, table_name, row_id)
  values (auth.uid(), tg_op, tg_table_name, v_row_id);

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Lock everything down: revoke anon everywhere, enable RLS on every table.
-- Default-deny = no policy means no access. Policies below open specific paths.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'person', 'student', 'guardian', 'student_guardian', 'staff', 'user_roles',
    'academic_year', 'term', 'house', 'class', 'subject', 'class_subject',
    'audit_log'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('revoke all on public.%I from anon;', t);
    -- authenticated gets table privileges; RLS policies filter the rows.
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated;', t
    );
  end loop;

  -- audit_log is append-only: authenticated may never update/delete it, and
  -- inserts happen only through the SECURITY DEFINER trigger.
  revoke insert, update, delete on public.audit_log from authenticated;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- POLICIES — identity core
-- ─────────────────────────────────────────────────────────────────────────

-- person: staff may read basic identity; a parent may read only their own
-- person row and the person rows of their own children. admin + admissions
-- write. (Teacher-to-own-class scoping is tightened in WS3 once class/enrolment
-- relationships exist.)
create policy person_select_staff on public.person
  for select to authenticated
  using (public.is_staff());

create policy person_select_self on public.person
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy person_select_own_children on public.person
  for select to authenticated
  using (
    exists (
      select 1 from public.student s
      where s.person_id = public.person.id
        and public.is_parent_of_student(s.id)
    )
  );

create policy person_insert_admissions on public.person
  for insert to authenticated
  with check (public.is_admin() or public.has_role('admissions'));

create policy person_update_admissions on public.person
  for update to authenticated
  using (public.is_admin() or public.has_role('admissions'))
  with check (public.is_admin() or public.has_role('admissions'));

create policy person_delete_admin on public.person
  for delete to authenticated
  using (public.is_admin());

-- student: staff read; parent reads only their own children. admin/admissions write.
create policy student_select_staff on public.student
  for select to authenticated
  using (public.is_staff());

create policy student_select_own_children on public.student
  for select to authenticated
  using (public.is_parent_of_student(id));

create policy student_insert_admissions on public.student
  for insert to authenticated
  with check (public.is_admin() or public.has_role('admissions'));

create policy student_update_admissions on public.student
  for update to authenticated
  using (public.is_admin() or public.has_role('admissions'))
  with check (public.is_admin() or public.has_role('admissions'));

create policy student_delete_admin on public.student
  for delete to authenticated
  using (public.is_admin());

-- guardian: admin/admissions and pastoral staff read; a parent reads only their
-- own guardian record. admin/admissions write.
create policy guardian_select_staff on public.guardian
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('admissions')
    or public.has_role('form_teacher')
    or public.has_role('house_staff')
  );

create policy guardian_select_self on public.guardian
  for select to authenticated
  using (person_id = public.current_person_id());

create policy guardian_insert_admissions on public.guardian
  for insert to authenticated
  with check (public.is_admin() or public.has_role('admissions'));

create policy guardian_update_admissions on public.guardian
  for update to authenticated
  using (public.is_admin() or public.has_role('admissions'))
  with check (public.is_admin() or public.has_role('admissions'));

create policy guardian_delete_admin on public.guardian
  for delete to authenticated
  using (public.is_admin());

-- student_guardian: admin/admissions and pastoral staff read; a parent reads
-- only the links to their own children. admin/admissions write.
create policy student_guardian_select_staff on public.student_guardian
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('admissions')
    or public.has_role('form_teacher')
    or public.has_role('house_staff')
  );

create policy student_guardian_select_parent on public.student_guardian
  for select to authenticated
  using (
    guardian_id in (
      select g.id from public.guardian g
      where g.person_id = public.current_person_id()
    )
  );

create policy student_guardian_insert_admissions on public.student_guardian
  for insert to authenticated
  with check (public.is_admin() or public.has_role('admissions'));

create policy student_guardian_update_admissions on public.student_guardian
  for update to authenticated
  using (public.is_admin() or public.has_role('admissions'))
  with check (public.is_admin() or public.has_role('admissions'));

create policy student_guardian_delete_admin on public.student_guardian
  for delete to authenticated
  using (public.is_admin());

-- staff: all staff may read the staff directory; admin writes. Parents: none.
create policy staff_select_staff on public.staff
  for select to authenticated
  using (public.is_staff());

create policy staff_write_admin on public.staff
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- POLICIES — user_roles (authorization source of truth)
-- A user may read ONLY their own roles. Only admin may read all or write.
-- ─────────────────────────────────────────────────────────────────────────
create policy user_roles_select_self on public.user_roles
  for select to authenticated
  using (user_id = auth.uid());

create policy user_roles_select_admin on public.user_roles
  for select to authenticated
  using (public.is_admin());

create policy user_roles_write_admin on public.user_roles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- POLICIES — academic / reference data
-- Readable by any signed-in user (non-sensitive structure). admin writes.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'academic_year', 'term', 'house', 'class', 'subject', 'class_subject'
  ]
  loop
    execute format(
      'create policy %1$s_select_authenticated on public.%1$I
         for select to authenticated using (true);', t
    );
    execute format(
      'create policy %1$s_write_admin on public.%1$I
         for all to authenticated
         using (public.is_admin()) with check (public.is_admin());', t
    );
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- POLICIES — audit_log: admin may read; nobody may write directly (trigger only)
-- ─────────────────────────────────────────────────────────────────────────
create policy audit_log_select_admin on public.audit_log
  for select to authenticated
  using (public.is_admin());
