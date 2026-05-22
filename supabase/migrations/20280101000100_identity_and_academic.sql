-- Workstream 1 — identity spine + academic structure.
--
-- IMPORTANT: Row-Level Security is intentionally NOT enabled here. Enabling RLS
-- with the full default-deny policy set is the Workstream 2 GATE. Until WS2
-- lands, these tables are UNPROTECTED — this is acceptable ONLY because no real
-- data exists yet (see CLAUDE.md: real data goes in after the WS8 security gate).
-- Do NOT put real student data in before WS2 RLS is reviewed and green.

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────
create type public.sex as enum ('male', 'female');

create type public.stream as enum ('science', 'general_arts', 'business');

create type public.track as enum ('wassce', 'wassce_igcse');

create type public.year_group as enum ('shs1', 'shs2', 'shs3');

create type public.student_status as enum (
  'prospective', -- applicant / not yet enrolled
  'enrolled',
  'withdrawn',
  'graduated',
  'dismissed'
);

create type public.guardian_relationship as enum (
  'mother', 'father', 'grandparent', 'aunt_uncle', 'sibling', 'guardian', 'other'
);

-- The nine roles from CLAUDE.md. RLS (WS2) is enforced against this enum.
create type public.app_role as enum (
  'admin',
  'teacher',
  'form_teacher',
  'house_staff',
  'bursary',
  'nurse',
  'dsl',
  'admissions',
  'parent'
);

-- ─────────────────────────────────────────────────────────────────────────
-- Identity spine — one `person` per human; everything links back to it.
-- ─────────────────────────────────────────────────────────────────────────
create table public.person (
  id uuid primary key default gen_random_uuid(),
  -- A person may (staff, parent) or may not (most students) have a login.
  auth_user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  preferred_name text,
  date_of_birth date,
  sex public.sex,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table public.student (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references public.person (id) on delete restrict,
  -- Auto-generated on enrolment (WS3); null while only an applicant.
  admission_no text unique,
  stream public.stream,
  track public.track,
  year_group public.year_group,
  status public.student_status not null default 'prospective',
  enrolled_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table public.guardian (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references public.person (id) on delete restrict,
  occupation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

-- A guardian may have several children; a student several guardians. Collection
-- and wallet authority live here (read by the security gate and wallet system).
create table public.student_guardian (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student (id) on delete cascade,
  guardian_id uuid not null references public.guardian (id) on delete cascade,
  relationship public.guardian_relationship,
  is_primary boolean not null default false,
  is_authorised_collector boolean not null default false,
  can_top_up_wallet boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (student_id, guardian_id)
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references public.person (id) on delete restrict,
  staff_no text unique,
  job_title text,
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

-- Source of truth for authorization. One row per (user, role). RLS reads this.
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (user_id, role)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Academic structure
-- ─────────────────────────────────────────────────────────────────────────
create table public.academic_year (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g. '2028/2029'
  starts_on date,
  ends_on date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.term (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_year (id) on delete cascade,
  number int not null check (number between 1 and 3),
  name text, -- e.g. 'Term 1'
  starts_on date,
  ends_on date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, number)
);

create table public.house (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  motto text,
  colour text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_year (id) on delete restrict,
  year_group public.year_group not null,
  stream public.stream,
  name text not null, -- e.g. 'SHS1 Science A'
  form_teacher_staff_id uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, name)
);

create table public.subject (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  is_core boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Which subjects a class takes, and who teaches each.
create table public.class_subject (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.class (id) on delete cascade,
  subject_id uuid not null references public.subject (id) on delete restrict,
  teacher_staff_id uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, subject_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at triggers (function defined in the WS0 init migration)
-- ─────────────────────────────────────────────────────────────────────────
create trigger set_updated_at before update on public.person
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.student
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.guardian
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.student_guardian
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.staff
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.academic_year
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.term
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.house
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.class
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.subject
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.class_subject
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Authorization helpers — used by RLS policies in WS2 and by the app.
-- SECURITY DEFINER so policies can call them without recursive RLS on
-- user_roles. search_path pinned for safety.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = check_role
  );
$$;

create or replace function public.current_roles()
returns setof public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select ur.role from public.user_roles ur where ur.user_id = auth.uid();
$$;

comment on function public.has_role(public.app_role) is
  'True if the current auth user holds the given role. For RLS policies.';

-- ─────────────────────────────────────────────────────────────────────────
-- Entrenched reference data: the four houses. Idempotent.
-- ─────────────────────────────────────────────────────────────────────────
insert into public.house (name, motto) values
  ('Sankofa',        'Return and fetch it'),
  ('Gye Nyame',      'Except for God'),
  ('Mate Masie',     'What I hear, I keep'),
  ('Asase Ye Duru',  'The earth has weight')
on conflict (name) do nothing;
