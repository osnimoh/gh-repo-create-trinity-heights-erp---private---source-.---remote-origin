import { getCurrentRoles } from "@/lib/auth/session";
import { roleLabel } from "@/lib/auth/roles";

export default async function DashboardPage() {
  const roles = await getCurrentRoles();

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted mt-2">
        Welcome to the Trinity Heights School ERP.
      </p>

      <div className="border-navy/10 mt-6 rounded-lg border bg-white p-6">
        <h2 className="text-base font-semibold">Your access</h2>
        {roles.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {roles.map((r) => (
              <li
                key={r}
                className="bg-cream text-navy rounded-full px-3 py-1 text-sm"
              >
                {roleLabel(r)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-maroon mt-3 text-sm">
            No role has been assigned to your account yet. An administrator must
            grant you a role before you can use the modules.
          </p>
        )}
      </div>
    </section>
  );
}
