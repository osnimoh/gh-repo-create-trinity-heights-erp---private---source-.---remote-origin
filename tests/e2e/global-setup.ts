import { createClient } from "@supabase/supabase-js";
import { E2E_ADMIN } from "./credentials";

// Creates the e2e admin (auth user + admin role) via the service role before
// the specs run. The CI DB is reset per run, so this starts from clean.
export default async function globalSetup() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "e2e global setup needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const svc = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await svc.auth.admin.createUser({
    email: E2E_ADMIN.email,
    password: E2E_ADMIN.password,
    email_confirm: true,
  });

  let userId = data?.user?.id;
  if (error || !userId) {
    // Already exists (re-run on a non-reset DB): find them.
    const { data: list } = await svc.auth.admin.listUsers();
    userId = list?.users.find((u) => u.email === E2E_ADMIN.email)?.id;
  }
  if (!userId) throw new Error(`could not seed e2e admin: ${error?.message}`);

  await svc
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
}
