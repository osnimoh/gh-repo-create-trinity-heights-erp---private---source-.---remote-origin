import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// RLS test harness. We create real auth users with specific roles, sign in as
// each, and assert it can read/write EXACTLY what the role matrix in CLAUDE.md
// allows — and nothing else. Default-deny means anything not explicitly
// permitted must fail.
//
// Requires a local Supabase stack (`supabase start`, Docker). CI starts it and
// exports these env vars (printed by `supabase status -o env`):
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

/** True when local Supabase env is configured; lets suites skip cleanly. */
export function rlsEnvReady(): boolean {
  return Boolean(ANON_KEY && SERVICE_ROLE_KEY);
}

/** Privileged client (BYPASSES RLS). Use ONLY to arrange/clean up fixtures. */
export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Unauthenticated client (anon key, no session). */
export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type TestUser = {
  id: string;
  email: string;
  password: string;
};

/**
 * Create a confirmed auth user holding the given roles. Returns its id/creds.
 * Roles are inserted with the service client (bypasses RLS), matching how an
 * admin would assign them.
 */
export async function createTestUser(roles: AppRole[]): Promise<TestUser> {
  const svc = serviceClient();
  const email = `rls_${randomUUID()}@test.local`;
  const password = `Pw_${randomUUID()}`;

  const { data, error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`createUser failed: ${error?.message}`);
  }
  const id = data.user.id;

  if (roles.length > 0) {
    const { error: roleErr } = await svc
      .from("user_roles")
      .insert(roles.map((role) => ({ user_id: id, role })));
    if (roleErr) throw new Error(`role insert failed: ${roleErr.message}`);
  }

  return { id, email, password };
}

/** A client signed in as the given user (RLS applies as that user). */
export async function signInAs(user: TestUser): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`signIn failed: ${error.message}`);
  return client;
}

/** Delete an auth user (cascades user_roles; nulls person.auth_user_id). */
export async function deleteTestUser(id: string): Promise<void> {
  await serviceClient().auth.admin.deleteUser(id);
}
