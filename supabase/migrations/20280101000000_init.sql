-- Workstream 0 — foundational scaffolding only.
-- Extensions + shared helpers used by every later migration.
-- Real domain tables (person, student, ...) arrive in Workstream 1+.
-- All schema changes MUST be added as new timestamped migrations; never edit
-- an applied migration and never mutate the schema in the dashboard.

create extension if not exists "pgcrypto" with schema "extensions";   -- gen_random_uuid()
create extension if not exists "uuid-ossp" with schema "extensions";

-- Shared trigger to keep updated_at honest. Attach to every table that has it:
--   create trigger set_updated_at before update on <table>
--     for each row execute function public.set_updated_at();
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Generic BEFORE UPDATE trigger: stamps updated_at = now().';
