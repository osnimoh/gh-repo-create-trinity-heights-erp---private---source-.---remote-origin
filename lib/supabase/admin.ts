import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { publicEnv, serverEnv } from "@/lib/env";

// Service-role client — BYPASSES RLS. Only ever call this from a server action
// that has already verified the caller is an admin (requireAdmin). Never expose
// the key or this client to the browser. Used for operations the app must do on
// behalf of an admin that RLS can't express, e.g. reading auth.users to map a
// user id to an email.
export function createAdminClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
