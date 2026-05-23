import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";

// Hardening meta-test (CI). Connects directly to Postgres and asserts the
// security INVARIANTS that must hold for every table — so adding a new table
// without RLS, or a new protected table without audit, fails the build.
//
// CI exports DB_URL from `supabase status -o env`. Locally there's no DB, so
// this suite skips.
const DB_URL = process.env.DB_URL ?? "";
const d = describe.skipIf(!DB_URL);

// The four protected classes from CLAUDE.md — every write must be audited.
const PROTECTED = ["payment", "result", "health_record", "safeguarding_flag"];

let client: Client;

beforeAll(async () => {
  if (!DB_URL) return;
  client = new Client({ connectionString: DB_URL });
  await client.connect();
});

afterAll(async () => {
  if (client) await client.end();
});

d("RLS coverage", () => {
  it("every table in the public schema has RLS enabled", async () => {
    const { rows } = await client.query<{ relname: string }>(
      `select c.relname
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public'
         and c.relkind = 'r'
         and not c.relrowsecurity`,
    );
    const without = rows.map((r) => r.relname);
    expect(without, `tables missing RLS: ${without.join(", ")}`).toEqual([]);
  });
});

d("audit coverage", () => {
  it("each protected table has an audit_row trigger", async () => {
    const { rows } = await client.query<{ tbl: string }>(
      `select c.relname as tbl
       from pg_trigger t
       join pg_class c on c.oid = t.tgrelid
       join pg_proc p on p.oid = t.tgfoid
       where p.proname = 'audit_row' and not t.tgisinternal`,
    );
    const audited = new Set(rows.map((r) => r.tbl));
    for (const table of PROTECTED) {
      expect(audited.has(table), `${table} is not audited`).toBe(true);
    }
  });

  it("audit_log is append-only for authenticated (no update/delete grant)", async () => {
    const { rows } = await client.query<{ privilege_type: string }>(
      `select privilege_type
       from information_schema.role_table_grants
       where table_schema = 'public'
         and table_name = 'audit_log'
         and grantee = 'authenticated'`,
    );
    const privs = rows.map((r) => r.privilege_type);
    expect(privs).not.toContain("UPDATE");
    expect(privs).not.toContain("DELETE");
    expect(privs).not.toContain("INSERT");
  });
});
