-- Workstream 7 — Health, welfare & communications (RESTRICTED).
--
-- The tightest tables in the system:
--   * safeguarding_flag — readable/writable by the `dsl` role ONLY. NOT admin,
--     NOT nurse — NO exception, ever (CLAUDE.md guardrail). Audited.
--   * health_record, sick_bay_visit — nurse + admin manage; a parent may read
--     ONLY their own child's. Audited.
--   * catering integration — a narrow function exposing allergies ONLY, granted
--     to a dedicated `catering` role (never to app roles).
-- Comms: messages to audiences, in-app notifications, acknowledgements. The
-- SMS/email gateway is stubbed behind an interface (lib/comms/gateway.ts).

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────
create type public.safeguarding_severity as enum ('low', 'medium', 'high');
create type public.safeguarding_status as enum ('open', 'monitoring', 'closed');
create type public.message_audience as enum (
  'all_parents', 'all_staff', 'class', 'individual'
);
create type public.notification_channel as enum ('in_app', 'email', 'sms');
create type public.notification_status as enum ('queued', 'sent', 'failed');

-- ─────────────────────────────────────────────────────────────────────────
-- Health (restricted)
-- ─────────────────────────────────────────────────────────────────────────
create table public.health_record (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.student (id) on delete cascade,
  blood_group text,
  allergies text,
  conditions text,
  medications text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table public.sick_bay_visit (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student (id) on delete cascade,
  visited_at timestamptz not null default now(),
  complaint text,
  treatment text,
  outcome text,
  seen_by_staff_id uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

-- DSL ONLY. The most protected table in the platform.
create table public.safeguarding_flag (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student (id) on delete cascade,
  category text not null,
  severity public.safeguarding_severity not null default 'low',
  details text,
  status public.safeguarding_status not null default 'open',
  raised_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Communications
-- ─────────────────────────────────────────────────────────────────────────
create table public.message (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  audience public.message_audience not null,
  class_id uuid references public.class (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  send_email boolean not null default false,
  send_sms boolean not null default false,
  sender_user_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

create table public.notification (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.message (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  channel public.notification_channel not null default 'in_app',
  status public.notification_status not null default 'queued',
  created_at timestamptz not null default now()
);

create table public.acknowledgement (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.message (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index sick_bay_student_idx on public.sick_bay_visit (student_id);
create index safeguarding_student_idx on public.safeguarding_flag (student_id);
create index notification_user_idx on public.notification (user_id);

create trigger set_updated_at before update on public.health_record
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.sick_bay_visit
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.safeguarding_flag
  for each row execute function public.set_updated_at();

-- Audit every write to the protected tables.
create trigger audit_health_record
  after insert or update or delete on public.health_record
  for each row execute function public.audit_row();
create trigger audit_sick_bay_visit
  after insert or update or delete on public.sick_bay_visit
  for each row execute function public.audit_row();
create trigger audit_safeguarding_flag
  after insert or update or delete on public.safeguarding_flag
  for each row execute function public.audit_row();

-- ─────────────────────────────────────────────────────────────────────────
-- Catering integration — allergies ONLY, never the rest of the health record.
-- Granted to a dedicated `catering` role (the catering system connects as it).
-- ─────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'catering') then
    create role catering nologin;
  end if;
end;
$$;

create or replace function public.catering_allergies()
returns table (student_id uuid, full_name text, allergies text)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, p.full_name, hr.allergies
  from public.student s
  join public.person p on p.id = s.person_id
  left join public.health_record hr on hr.student_id = s.id
  where s.status = 'enrolled';
$$;

comment on function public.catering_allergies() is
  'Catering integration: exposes ONLY student name + allergies. Never other '
  'health fields. Granted to the catering role only.';

revoke all on function public.catering_allergies() from public, anon, authenticated;
grant usage on schema public to catering;
grant execute on function public.catering_allergies() to catering;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'health_record', 'sick_bay_visit', 'safeguarding_flag',
    'message', 'notification', 'acknowledgement'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('revoke all on public.%I from anon;', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end;
$$;

-- health_record: nurse + admin manage; parent reads own child.
create policy health_record_select on public.health_record
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('nurse')
    or public.is_parent_of_student(student_id)
  );
create policy health_record_write on public.health_record
  for all to authenticated
  using (public.is_admin() or public.has_role('nurse'))
  with check (public.is_admin() or public.has_role('nurse'));

-- sick_bay_visit: nurse + admin manage; parent reads own child.
create policy sick_bay_select on public.sick_bay_visit
  for select to authenticated
  using (
    public.is_admin()
    or public.has_role('nurse')
    or public.is_parent_of_student(student_id)
  );
create policy sick_bay_write on public.sick_bay_visit
  for all to authenticated
  using (public.is_admin() or public.has_role('nurse'))
  with check (public.is_admin() or public.has_role('nurse'));

-- safeguarding_flag: DSL ONLY — read AND write. No other role, no admin.
create policy safeguarding_dsl_only on public.safeguarding_flag
  for all to authenticated
  using (public.has_role('dsl'))
  with check (public.has_role('dsl'));

-- message: visible to its audience; composed by staff; managed by sender/admin.
create policy message_select on public.message
  for select to authenticated
  using (
    public.is_admin()
    or sender_user_id = auth.uid()
    or (audience = 'all_staff' and public.is_staff())
    or (audience = 'all_parents' and public.has_role('parent'))
    or (audience = 'class' and class_id is not null and public.is_teacher_of_class(class_id))
    or (audience = 'individual' and target_user_id = auth.uid())
  );
create policy message_insert on public.message
  for insert to authenticated
  with check (public.is_staff());
create policy message_update on public.message
  for update to authenticated
  using (public.is_admin() or sender_user_id = auth.uid())
  with check (public.is_admin() or sender_user_id = auth.uid());
create policy message_delete on public.message
  for delete to authenticated
  using (public.is_admin() or sender_user_id = auth.uid());

-- notification: a user sees their own; staff/admin create.
create policy notification_select on public.notification
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy notification_insert on public.notification
  for insert to authenticated
  with check (public.is_staff() or public.is_admin());

-- acknowledgement: you may only acknowledge as yourself; read your own.
create policy acknowledgement_select on public.acknowledgement
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy acknowledgement_insert on public.acknowledgement
  for insert to authenticated
  with check (user_id = auth.uid());
