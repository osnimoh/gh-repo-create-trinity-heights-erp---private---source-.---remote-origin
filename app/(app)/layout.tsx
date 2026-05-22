import { requireUser, getCurrentRoles } from "@/lib/auth/session";
import { visibleNav } from "@/lib/nav";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const roles = await getCurrentRoles();

  return (
    <div className="flex min-h-full">
      <Sidebar items={visibleNav(roles)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={user.email ?? ""} roles={roles} />
        <main className="bg-cream/40 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
