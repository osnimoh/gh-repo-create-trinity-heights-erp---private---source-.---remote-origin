# RLS Policies

One file per table, named `<table>.sql`. Each file is the reviewed source of
record for that table's Row-Level Security. The **migrations** in
`../migrations` are what actually apply policies to the database; the files here
mirror them for focused human review in PRs.

## Rules (from CLAUDE.md — non-negotiable)

- **Default-deny.** Enable RLS on every table. No policy = no access.
- `safeguarding_flag` is readable by the `dsl` role ONLY. No exception, ever.
- A `parent` may never read a row belonging to a child that is not theirs.
- Money (`payment`, `invoice`) and child-safety (`health_record`,
  `safeguarding_flag`) get the tightest policies and full audit logging.
- Every policy change ships with a migration **and** an RLS test in
  `/tests/rls`. Never weaken a policy to make a feature work.

## Workflow

1. Write/update the policy in a new timestamped migration under `../migrations`.
2. Mirror the final policy text into `<table>.sql` here for review.
3. Add/extend the matching test in `/tests/rls/<table>.test.ts`.
4. A human reviews and signs off (Workstream 2 gate) before merge.

Policies are populated starting in **Workstream 2 (RLS foundation)**.
