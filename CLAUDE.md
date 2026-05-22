# CLAUDE.md — Trinity Heights School ERP

## Project

A school management platform (ERP) for **Trinity Heights Senior High School** — a 600-student, Christian-character, co-educational **boarding** senior high school in Kumasi, Ghana. First intake September 2028. One platform over one shared database: admissions, student records, attendance, fees, academics, health/welfare, staff, communication, and a parent portal. Built for unreliable connectivity (offline-first) and the protection of minors' data.

## Non-negotiable principles (apply to every change)

1. **One identity spine.** A `person` exists once and may be a student, guardian, and/or staff. Never duplicate a human across tables; everything links to `person`.
2. **Security in the database, not the UI.** All access control is enforced by Supabase Row-Level Security (RLS) with **default-deny**. Hiding things in the React UI is never the access control.
3. **Two protected data classes:** money (fees/payments) and child-safety (health/safeguarding). These get the tightest RLS and full audit logging. `safeguarding_flag` is readable by the `dsl` role ONLY — no exception, ever.
4. **Audit everything sensitive.** Every read/write to `payment`, `result`, `health_record`, and `safeguarding_flag` is written to an append-only `audit_log`.
5. **Offline-first.** The app must function when the network drops and sync on reconnect. Treat outages as normal, not errors.
6. **Verify, don't trust.** Generate tests alongside code for: the 10% net-fee-floor rule, RLS access boundaries (each role sees only what it should), and any money calculation. Never weaken RLS to make a feature work — fix the feature.
7. **Ghana context.** Currency **GH₵** (Ghana Cedi). Dates **DD/MM/YYYY**. Keep payloads light.

## Tech stack

- **Frontend:** Next.js (App Router) + React + **TypeScript** (strict). Tailwind CSS for styling.
- **Backend / DB / Auth:** Supabase (Postgres + Auth + Storage + Realtime). All schema changes via **SQL migrations** checked into the repo (`/supabase/migrations`). Never mutate the schema by hand in the dashboard.
- **Data access:** typed Supabase client; generate and commit DB types (`supabase gen types typescript`).
- **Offline:** IndexedDB via **Dexie.js**, with a **mutation queue** that replays writes to Supabase on reconnect (mirror the architecture used in Folia). Service worker / PWA for installability and offline assets.
- **State/data fetching:** TanStack Query (with offline-aware caching).
- **Testing:** Vitest (unit), Playwright (e2e), and **pgTAP or SQL-level tests for RLS policies**.
- **Validation:** Zod schemas shared between client and server.
- **CI:** GitHub Actions — typecheck, lint, test, and run migrations against a throwaway DB on every PR.

## Repo conventions

- `/app` — Next.js routes (route groups per module: `(admissions)`, `(students)`, `(fees)`, etc.)
- `/components` — shared UI; `/components/ui` — primitives.
- `/lib` — `supabase/` (clients), `db/` (typed queries), `offline/` (Dexie + sync), `auth/` (role helpers), `validation/` (Zod).
- `/supabase/migrations` — timestamped SQL migrations (source of truth for schema).
- `/supabase/policies` — RLS policies, one file per table, reviewed in PRs.
- `/tests` — `unit/`, `e2e/`, `rls/`.
- Conventional commits. Small PRs. Every schema or policy change ships with a migration and a test.

## Design system

- Colours: Maroon `#722F37` (primary), Navy `#0D2B45` (headings/structure), Gold `#B8860B` (accent), cream `#F4F1ED` (alt rows), white bg, dark text.
- Serif headings (Georgia/Cambria-like), sans body (Inter). Warm, professional, calm — a caring boarding school. Mobile-first; staff and parents use phones.
- Footer/login motto: "Knowledge. Character. Country."

## Roles (stored in `user_roles`; enforced by RLS)

`admin` (leadership, broad), `teacher` (own classes only; no fees/health), `form_teacher`/`house_staff` (own class/house pastoral), `bursary` (fees only; basic identity), `nurse` (health + sick bay only), `dsl` (safeguarding ONLY + pastoral context), `admissions` (applications/enrolment), `parent` (their own children only — nothing about others).

## Domain rules

- Streams: **Science, General Arts, Business**. Tracks: **WASSCE** or **WASSCE + IGCSE**.
- Year groups **SHS1/SHS2/SHS3**; three terms per year. One class per student per year + one house; keep class history.
- Houses: **Sankofa, Gye Nyame, Mate Masie, Asase Ye Duru**.
- Admissions is **one-gate**: entrance exam only, no interviews.
- **10% net-fee floor (entrenched):** no scholarship or combination may reduce a family's net payable below 10% of the standard fee. Enforce in fee logic AND in a DB constraint/check where feasible; cover with tests.

## Data model (target — build via migrations, incrementally)

Identity: `person`, `student`, `guardian`, `student_guardian` (with `is_authorised_collector`, `can_top_up_wallet`), `staff`, `user_roles`.
Academic: `academic_year`, `term`, `house`, `class`, `subject`, `class_subject`.
Admissions: `application`, `enrolment`.
Attendance: `attendance_session`, `attendance_mark`, `boarding_roll`, `exeat`.
Fees: `fee_structure`, `scholarship`, `invoice`, `payment`.
Academics: `assessment`, `result`, `report_card`, `timetable`.
Health (restricted): `health_record`, `sick_bay_visit`, `safeguarding_flag`.
Comms: `message`, `notification`, `acknowledgement`.
Cross-cutting: `audit_log`, plus offline `sync_queue` (client-side).
All tables: UUID PKs, `created_at`, `updated_at`, and `created_by` where relevant. Keep history rather than overwriting status/class/house.

## Integration points (build interfaces, not couplings)

- **Cashless wallet** (separate system): reads `student` identity + `student_guardian.can_top_up_wallet`. Expose a narrow, read-only API; do not build the wallet engine here.
- **Security gate (collection):** reads `exeat` + `student_guardian.is_authorised_collector`.
- **Catering (allergies):** a narrow read-only endpoint exposing `health_record.allergies` only — never the whole health record.
- **SMS/email gateway, accounting system, EMIS/WAEC exports:** stub behind interfaces; real formats `[CONFIRM]` before implementing.

## Guardrails — do NOT

- Do not weaken or bypass RLS to ship a feature.
- Do not expose `safeguarding_flag` to any role other than `dsl`.
- Do not let a `parent` read any row belonging to a child that is not theirs.
- Do not edit a balance/score directly without an audit trail.
- Do not change the schema outside a committed migration.
- Do not implement EMIS/WAEC export formats until confirmed; scaffold only.

## Compliance (confirm, don't assume)

- **Data Protection Act, 2012 (Act 843)** — minors' data; minimum necessary; consider data residency (where Supabase hosts). `[CONFIRM registration/obligations.]`
- **EMIS / Annual School Census** (Ministry of Education / SRIM) and **WAEC** candidate data — exports scaffolded, formats `[CONFIRM]`.
