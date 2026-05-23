-- Workstream 8 follow-up — review finding #4: house-scope boarding roll & exeat.
--
-- Until now any `house_staff` user could read/write EVERY house's boarding roll
-- and exeats, and had broad student-identity read. This adds a staff↔house
-- assignment and scopes house_staff to their assigned house(s):
--   * boarding_roll / exeat — only their house's students.
--   * student / person / guardian identity — only their house's students.
-- All cross-table checks go through SECURITY DEFINER helpers to avoid the
-- mutual-RLS-recursion class of bug.

-- ─────────────────────────────────────────────────────────────────────────
-- staff ↔ house assignment
-- ─────────────────────────────────────────────────────────────────────────
create table public.staff_house (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  house_id uuid not null references public.house (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (staff_id, house_id)
);

alter table public.staff_house enable row level security;
revoke all on public.staff_house from anon;
grant select, insert, update, delete on public.staff_house to authenticated;

-- admin manages assignments; a staff member may see their own.
create policy staff_house_select on public.staff_house
  for select to authenticated
  using (public.is_admin() or staff_id = public.current_staff_id());
create policy staff_house_write_admin on public.staff_house
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Scoping helpers (SECURITY DEFINER — read assignment/enrolment as owner)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.is_house_staff_of(p_house_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('house_staff') and exists (
    select 1 from public.staff_house sh
    where sh.staff_id = public.current_staff_id()
      and sh.house_id = p_house_id
  );
$$;

create or replace function public.is_house_staff_of_student(p_student_id uuid)
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
      and e.house_id is not null
      and public.is_house_staff_of(e.house_id)
  );
$$;

create or replace function public.is_house_staff_of_guardian(p_guardian_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.student_guardian sg
    where sg.guardian_id = p_guardian_id
      and public.is_house_staff_of_student(sg.student_id)
  );
$$;

-- house_staff no longer gets school-wide identity; it is scoped below.
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
    or public.has_role('dsl');
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- boarding_roll — scope to the staff member's assigned house.
-- ─────────────────────────────────────────────────────────────────────────
drop policy boarding_roll_select on public.boarding_roll;
drop policy boarding_roll_write on public.boarding_roll;

create policy boarding_roll_select on public.boarding_roll
  for select to authenticated
  using (
    public.is_admin()
    or public.is_house_staff_of(house_id)
    or public.is_parent_of_student(student_id)
  );
create policy boarding_roll_write on public.boarding_roll
  for all to authenticated
  using (public.is_admin() or public.is_house_staff_of(house_id))
  with check (public.is_admin() or public.is_house_staff_of(house_id));

-- ─────────────────────────────────────────────────────────────────────────
-- exeat — scope to the student's house (exeat has no house_id of its own).
-- ─────────────────────────────────────────────────────────────────────────
drop policy exeat_select on public.exeat;
drop policy exeat_write on public.exeat;

create policy exeat_select on public.exeat
  for select to authenticated
  using (
    public.is_admin()
    or public.is_house_staff_of_student(student_id)
    or public.is_parent_of_student(student_id)
  );
create policy exeat_write on public.exeat
  for all to authenticated
  using (public.is_admin() or public.is_house_staff_of_student(student_id))
  with check (public.is_admin() or public.is_house_staff_of_student(student_id));

-- ─────────────────────────────────────────────────────────────────────────
-- Identity — house_staff now reads only its own house's students/guardians.
-- ─────────────────────────────────────────────────────────────────────────
drop policy student_select_identity on public.student;
create policy student_select_identity on public.student
  for select to authenticated
  using (
    public.can_read_all_identity()
    or public.is_teacher_of_student(id)
    or public.is_house_staff_of_student(id)
  );

drop policy person_select_identity on public.person;
create policy person_select_identity on public.person
  for select to authenticated
  using (
    public.can_read_all_identity()
    or (
      public.is_staff()
      and exists (
        select 1 from public.staff st where st.person_id = public.person.id
      )
    )
    or exists (
      select 1 from public.student s
      where s.person_id = public.person.id
        and (
          public.is_teacher_of_student(s.id)
          or public.is_house_staff_of_student(s.id)
        )
    )
  );

drop policy guardian_select_scoped on public.guardian;
create policy guardian_select_scoped on public.guardian
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('admissions')
    or public.is_teacher_of_guardian(id)
    or public.is_house_staff_of_guardian(id)
  );

drop policy student_guardian_select_scoped on public.student_guardian;
create policy student_guardian_select_scoped on public.student_guardian
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('admissions')
    or public.is_teacher_of_student(student_id)
    or public.is_house_staff_of_student(student_id)
  );
