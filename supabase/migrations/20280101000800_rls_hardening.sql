-- Workstream 8 — RLS hardening from the policy review.
--
-- #1 safeguarding audit metadata must not leak to admin (DSL-only, no exception).
-- #2 plain teachers must read ONLY their own classes' student identity.
-- #3 form/house staff must not read EVERY family's guardian/contact data.
--
-- #4 (house scoping for boarding/exeat) needs a staff↔house table and is a
-- separate follow-up; house_staff keeps broad identity read for now (flagged).

-- ─────────────────────────────────────────────────────────────────────────
-- New helpers
-- ─────────────────────────────────────────────────────────────────────────

-- True when the current user teaches (or form-teaches) a class the student is
-- actively enrolled in.
create or replace function public.is_teacher_of_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrolment e
    where e.student_id = p_student_id
      and e.status = 'active'
      and public.is_teacher_of_class(e.class_id)
  );
$$;

-- Roles that legitimately need school-wide BASIC IDENTITY lookup to operate:
-- admin (broad), admissions (enrolment), bursary (billing), nurse (health),
-- dsl (pastoral context). house_staff is included pending #4 (house scoping).
create or replace function public.can_read_all_identity()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or public.has_role('admissions')
    or public.has_role('bursary')
    or public.has_role('nurse')
    or public.has_role('dsl')
    or public.has_role('house_staff'); -- TODO(#4): scope to assigned house
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- #2 — person & student: scope plain teachers to their own-class students.
-- ─────────────────────────────────────────────────────────────────────────
drop policy person_select_staff on public.person;

create policy person_select_identity on public.person
  for select to authenticated
  using (
    public.can_read_all_identity()
    -- staff directory: staff may see other staff members' person rows
    or (
      public.is_staff()
      and exists (
        select 1 from public.staff st where st.person_id = public.person.id
      )
    )
    -- teachers/form-teachers: only the persons of students they teach
    or exists (
      select 1 from public.student s
      where s.person_id = public.person.id
        and public.is_teacher_of_student(s.id)
    )
  );

drop policy student_select_staff on public.student;

create policy student_select_identity on public.student
  for select to authenticated
  using (
    public.can_read_all_identity() or public.is_teacher_of_student(id)
  );

-- ─────────────────────────────────────────────────────────────────────────
-- #3 — guardian & student_guardian: scope form/house staff to their students.
-- ─────────────────────────────────────────────────────────────────────────
drop policy guardian_select_staff on public.guardian;

create policy guardian_select_scoped on public.guardian
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('admissions')
    or exists (
      select 1 from public.student_guardian sg
      where sg.guardian_id = public.guardian.id
        and public.is_teacher_of_student(sg.student_id)
    )
  );

drop policy student_guardian_select_staff on public.student_guardian;

create policy student_guardian_select_scoped on public.student_guardian
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('admissions')
    or public.is_teacher_of_student(student_id)
  );

-- ─────────────────────────────────────────────────────────────────────────
-- #1 — audit_log: admin sees everything EXCEPT safeguarding metadata; only the
-- DSL sees safeguarding audit rows. Keeps "safeguarding is DSL-only" intact
-- even at the metadata (existence/actor/volume) level.
-- ─────────────────────────────────────────────────────────────────────────
drop policy audit_log_select_admin on public.audit_log;

create policy audit_log_select_admin on public.audit_log
  for select to authenticated
  using (public.is_admin() and table_name <> 'safeguarding_flag');

create policy audit_log_select_dsl_safeguarding on public.audit_log
  for select to authenticated
  using (public.has_role('dsl') and table_name = 'safeguarding_flag');
