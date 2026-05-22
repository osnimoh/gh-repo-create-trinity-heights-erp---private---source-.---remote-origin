-- Seed data for local/staging only. NEVER seed real student data here.
-- The four houses are entrenched reference data and are seeded in the
-- identity/academic migration, not here. This file holds dev convenience data.
-- Keep everything idempotent.

-- First-intake academic year (Sept 2028) + its three terms.
insert into public.academic_year (name, starts_on, ends_on, is_current)
values ('2028/2029', '2028-09-01', '2029-07-31', true)
on conflict (name) do nothing;

insert into public.term (academic_year_id, number, name, is_current)
select ay.id, t.number, t.name, t.is_current
from public.academic_year ay
cross join (values
  (1, 'Term 1', true),
  (2, 'Term 2', false),
  (3, 'Term 3', false)
) as t (number, name, is_current)
where ay.name = '2028/2029'
on conflict (academic_year_id, number) do nothing;

-- To test login locally:
--   1. Create a user in Supabase Studio (Auth > Users) or via the API.
--   2. Grant a role by inserting into user_roles, e.g.:
--        insert into public.user_roles (user_id, role)
--        values ('<auth-user-uuid>', 'admin');
--   3. Sign in at /login. The dashboard shows the assigned role(s).
