import { describe, it, expect } from "vitest";
import { APP_ROLES, rlsEnvReady } from "./helpers";

// Workstream 2 (GATE) fills this with the full role-by-role access matrix:
//   - only `dsl` can read safeguarding_flag
//   - a parent cannot read another family's rows
//   - bursary sees fees but not health; nurse sees health but not fees; etc.
// Until then we assert the harness loads. Real assertions require a running
// local Supabase stack (`supabase start`), which CI provides.
describe("RLS foundation (scaffold)", () => {
  it("knows the full role set from CLAUDE.md", () => {
    expect(APP_ROLES).toContain("dsl");
    expect(APP_ROLES).toContain("parent");
    expect(APP_ROLES.length).toBe(9);
  });

  it.skipIf(!rlsEnvReady())(
    "default-deny: an unauthenticated client reads nothing (enabled in WS2)",
    () => {
      // Placeholder — implemented against real tables in Workstream 2.
      expect(true).toBe(true);
    },
  );
});
