import { requireAdmin } from "@/lib/auth/session";
import { listRoleAssignments } from "@/lib/db/admin";
import { roleLabel } from "@/lib/auth/roles";
import { SettingsNav } from "../nav";
import { AssignRoleForm } from "./assign-role-form";
import { removeRole } from "../actions";

export default async function RolesPage() {
  await requireAdmin();
  const assignments = await listRoleAssignments();

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <SettingsNav />

      <h2 className="mt-6 text-base font-semibold">Assign a role</h2>
      <p className="text-muted mt-1 mb-3 text-sm">
        The user must already have an account (signed up). Roles drive all
        access control via RLS.
      </p>
      <AssignRoleForm />

      <h2 className="mt-8 text-base font-semibold">Current assignments</h2>
      <div className="border-navy/10 mt-2 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted px-4 py-6 text-center">
                  No roles assigned yet.
                </td>
              </tr>
            ) : (
              assignments.map((a) => (
                <tr key={a.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">{a.email}</td>
                  <td className="px-4 py-2">{roleLabel(a.role)}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={removeRole}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="border-navy/20 hover:bg-cream rounded-md border px-3 py-1 text-xs"
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
