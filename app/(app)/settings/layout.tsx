import { requireAdmin } from "@/lib/auth/session";

// Everything under /settings is admin-only. RLS is still the real wall; this
// just keeps non-admins out of the UI.
export default async function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return <>{children}</>;
}
