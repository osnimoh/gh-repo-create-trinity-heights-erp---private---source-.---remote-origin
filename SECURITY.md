# Security & Go-Live Gate — Trinity Heights School ERP

This document records the security posture and the **human gate** that must be
cleared before any real child's data is entered. Per CLAUDE.md and the build
brief, code being green in CI is necessary but **not sufficient** — the items in
"GO-LIVE GATE" require human sign-off.

## Posture (built & CI-verified)

- **Access control is in the database.** Row-Level Security (default-deny) on
  every table; the React UI never enforces access, only convenience.
  Verified continuously by `tests/rls/*` against real Postgres in CI, plus a
  meta-test (`tests/rls/security-coverage.test.ts`) that fails the build if any
  public table lacks RLS.
- **Two entrenched rules, proven:**
  - 10% net-fee floor — app logic + `generate_invoice` RPC + DB CHECK
    constraint; unit + integration tests.
  - `safeguarding_flag` is **DSL-only** (read and write) — admin, nurse, teacher
    and parents are all denied; proven in CI.
- **Audit:** the four protected tables (`payment`, `result`, `health_record`,
  `safeguarding_flag`) write to an append-only `audit_log` on every change via a
  trigger. The meta-test asserts each is audited and that `audit_log` grants no
  UPDATE/DELETE to `authenticated`.
- **Secrets:** the service-role key is server-only (`lib/env.ts` `serverEnv()`),
  never imported by client code; `.env*` is gitignored (`.env.example` only is
  committed). Public anon key is RLS-gated.
- **Offline-first:** reads cached in IndexedDB (Dexie); writes queued and
  replayed on reconnect with per-mutation conflict policy — money/results/
  safeguarding use `server_confirm` (never assumed committed). Unit-tested.
- **Rate limiting:** interface in `lib/security/rate-limit.ts`. The in-memory
  implementation is single-instance only — see below.
- **Exports:** EMIS/Annual-Census and WAEC are **scaffolds only**
  (`lib/exports`, all marked `status: "scaffold"`). Formats are `[CONFIRM]` and
  must not be submitted until confirmed.

## Known gaps / follow-ups (non-blocking but tracked)

- **No browser e2e.** Behaviour is verified at the data layer (RLS/RPC) and via
  unit tests; the offline→online flow has unit coverage but no Playwright run.
- **UI is build-verified only** — pages compile and render in `next build`; no
  automated browser interaction tests.
- **Rate limiter is in-memory** — replace with a shared store (e.g. Upstash
  Redis) before production; wire it to login and sensitive actions.
- (Resolved) Teacher identity reads are class-scoped (#2) and `house_staff` is
  house-scoped for boarding/exeat/identity via the `staff_house` table (#4).
  Note: a staff member with NO `staff_house` assignment sees nothing for their
  house — assignment is an operational step when onboarding house staff.
- **Protected-table READS** are not yet audited (Postgres has no SELECT
  trigger) — add dedicated audited RPCs for safeguarding/health reads if read
  auditing is required by policy.

## GO-LIVE GATE — must be signed off before real minors' data

- [ ] **RLS policy review** — a human has read and signed off every policy
      (`supabase/policies/ROLE_MATRIX.md`) and the migrations they mirror.
- [ ] **Audit coverage** confirmed for all sensitive read/write paths.
- [ ] **Penetration / security test** performed against a staging deployment.
- [ ] **Data Protection Act, 2012 (Act 843)** obligations confirmed:
      registration, lawful basis, minimum-necessary, retention, subject rights.
- [ ] **Data residency** decided and documented (where Supabase hosts the data;
      acceptable under Act 843?).
- [ ] **Rate limiting** backed by a shared store and applied to login + sensitive
      actions.
- [ ] **Secret management** reviewed (key rotation, no secrets in client bundle,
      CI secrets scoped).
- [ ] **Dependency review** (no known-vulnerable packages; `npm audit` triaged).
- [ ] **Staging exercised end-to-end with seeded FAKE data**; backups, restore,
      and incident response confirmed.
- [ ] **Offline sync correctness** reviewed (conflict handling for money/results
      is conservative and surfaces failures, never silently drops).

Only when every box above is checked does real student data go into production.
