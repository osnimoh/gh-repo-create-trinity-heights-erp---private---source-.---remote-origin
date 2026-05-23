import "server-only";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "./roles";

// Server-side session/role access. UI gating built on this is convenience only;
// the database (RLS) is the real boundary.

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Redirects to /login when there is no session. Use in protected layouts. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects away unless the caller is an admin. Gate admin-only pages/actions. */
export async function requireAdmin(): Promise<void> {
  const roles = await getCurrentRoles();
  if (!roles.includes("admin")) redirect("/");
}

export async function getCurrentRoles(): Promise<AppRole[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return (data ?? []).map((r) => r.role);
}
