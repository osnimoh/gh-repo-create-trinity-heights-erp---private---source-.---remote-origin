# RLS Role Matrix — review artifact (Workstream 2)

**Authoritative source:** the policies are defined in
`/supabase/migrations/20280101000200_rls_foundation.sql`. This document mirrors
them in plain language for human sign-off (the WS2 gate). If the two ever
disagree, the migration wins and this doc is the bug — keep them in step.

**Posture:** default-deny. RLS is enabled on every table; `anon` (logged-out) is
revoked from everything; `authenticated` has table privileges and the policies
below filter rows. `service_role` bypasses RLS and is used only by trusted
server code and test fixtures.

**Legend:** ✅ allowed · — denied · _(own)_ row-scoped to the user's own data.

## Helper functions (in the migration)

| Function                    | Meaning                                            |
| --------------------------- | -------------------------------------------------- |
| `is_admin()`                | current user holds `admin`                         |
| `is_staff()`                | holds any internal role (everyone except `parent`) |
| `current_person_id()`       | the `person.id` linked to the logged-in auth user  |
| `is_parent_of_student(sid)` | current user is a guardian of student `sid`        |
| `has_role(role)`            | current user holds a specific role                 |

## Identity tables

### `person`

| Role                                                                  | SELECT                                     | INSERT | UPDATE | DELETE |
| --------------------------------------------------------------------- | ------------------------------------------ | ------ | ------ | ------ |
| admin                                                                 | ✅                                         | ✅     | ✅     | ✅     |
| admissions                                                            | ✅ (via staff)                             | ✅     | ✅     | —      |
| other staff (teacher, form_teacher, house_staff, bursary, nurse, dsl) | ✅                                         | —      | —      | —      |
| parent                                                                | ✅ _(own person + own children's persons)_ | —      | —      | —      |
| self (any user)                                                       | ✅ _(own person row)_                      | —      | —      | —      |

> Teacher access is currently "all basic identity," not yet class-scoped — the
> student↔class relationship doesn't exist until WS3. Tighten then.

### `student`

| Role        | SELECT                   | INSERT | UPDATE | DELETE |
| ----------- | ------------------------ | ------ | ------ | ------ |
| admin       | ✅                       | ✅     | ✅     | ✅     |
| admissions  | ✅                       | ✅     | ✅     | —      |
| other staff | ✅                       | —      | —      | —      |
| parent      | ✅ _(own children only)_ | —      | —      | —      |

### `guardian`

| Role                         | SELECT                     | INSERT | UPDATE | DELETE |
| ---------------------------- | -------------------------- | ------ | ------ | ------ |
| admin                        | ✅                         | ✅     | ✅     | ✅     |
| admissions                   | ✅                         | ✅     | ✅     | —      |
| form_teacher, house_staff    | ✅                         | —      | —      | —      |
| parent                       | ✅ _(own guardian record)_ | —      | —      | —      |
| teacher, bursary, nurse, dsl | —                          | —      | —      | —      |

### `student_guardian`

| Role                      | SELECT                       | INSERT | UPDATE | DELETE |
| ------------------------- | ---------------------------- | ------ | ------ | ------ |
| admin                     | ✅                           | ✅     | ✅     | ✅     |
| admissions                | ✅                           | ✅     | ✅     | —      |
| form_teacher, house_staff | ✅                           | —      | —      | —      |
| parent                    | ✅ _(links to own children)_ | —      | —      | —      |
| others                    | —                            | —      | —      | —      |

### `staff`

| Role      | SELECT         | INSERT | UPDATE | DELETE |
| --------- | -------------- | ------ | ------ | ------ |
| admin     | ✅             | ✅     | ✅     | ✅     |
| any staff | ✅ (directory) | —      | —      | —      |
| parent    | —              | —      | —      | —      |

## Authorization

### `user_roles` (source of truth)

| Role     | SELECT                      | INSERT/UPDATE/DELETE |
| -------- | --------------------------- | -------------------- |
| admin    | ✅ (all)                    | ✅                   |
| any user | ✅ _(only their own roles)_ | —                    |

## Academic / reference data

`academic_year`, `term`, `house`, `class`, `subject`, `class_subject`

| Role               | SELECT | INSERT/UPDATE/DELETE |
| ------------------ | ------ | -------------------- |
| any signed-in user | ✅     | —                    |
| admin              | ✅     | ✅                   |

> Non-sensitive structural data, readable by all authenticated users. Writes are
> admin-only for now; some (e.g. class/subject assignment) may open to specific
> staff in later workstreams.

## Audit

### `audit_log` (append-only)

| Role          | SELECT | INSERT | UPDATE | DELETE |
| ------------- | ------ | ------ | ------ | ------ |
| admin         | ✅     | —      | —      | —      |
| everyone else | —      | —      | —      | —      |

> Inserts happen ONLY via the `audit_row()` SECURITY DEFINER trigger. No role
> (not even admin) may UPDATE or DELETE — privileges are revoked. The trigger is
> attached to `payment`, `result`, `health_record`, `safeguarding_flag` when
> those tables are created (WS5/6/7).

## Not yet covered (tracked for later workstreams)

- `payment`, `invoice`, `fee_structure`, `scholarship` (WS5) — money: tightest RLS + audit.
- `result`, `assessment`, `report_card` (WS6) — teacher own-classes scoping.
- `health_record`, `sick_bay_visit`, `safeguarding_flag` (WS7) — **`safeguarding_flag` is `dsl`-only, no exceptions.**
- Catering allergies read-only endpoint; security-gate / wallet narrow APIs.
- WS7 explicitly RE-VERIFIES RLS on the sensitive tables.

## Reviewer sign-off

- [ ] Reviewer: **\*\*\*\***\_\_\_\_**\*\*\*\*** Date: \***\*\_\_\*\***
- [ ] Every policy above matches the migration.
- [ ] Parent isolation confirmed (no cross-family reads).
- [ ] `user_roles` writable by admin only.
- [ ] Default-deny verified: tables with no matching policy return nothing.
