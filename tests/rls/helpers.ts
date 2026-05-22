import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// RLS test harness. Each test signs in (or impersonates) a user holding a
// specific role, then asserts it can read/write EXACTLY what the role matrix in
// CLAUDE.md allows — and nothing else. Default-deny means anything not
// explicitly permitted must fail.
//
// Requires a local Supabase stack: `supabase start` (Docker). CI spins this up.
// These env vars are printed by `supabase start`:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

export const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
export const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const APP_ROLES = [
  "admin",
  "teacher",
  "form_teacher",
  "house_staff",
  "bursary",
  "nurse",
  "dsl",
  "admissions",
  "parent",
] as const;
export type AppRole = (typeof APP_ROLES)[number];

/** A privileged client (bypasses RLS) — used only to arrange test fixtures. */
export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** A client authenticated as a given test user's access token (RLS applies). */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** True when local Supabase env is configured; lets suites skip cleanly. */
export function rlsEnvReady(): boolean {
  return Boolean(ANON_KEY && SERVICE_ROLE_KEY);
}
