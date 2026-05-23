import { requireAdmin } from "@/lib/auth/session";
import { listStaffHouse, listStaffWithNames } from "@/lib/db/admin";
import { listHouses } from "@/lib/db/admissions";
import { SettingsNav } from "../nav";
import { AssignHouseStaffForm } from "./assign-form";
import { removeHouseStaff } from "../actions";

export default async function HouseStaffPage() {
  await requireAdmin();
  const [staff, houses, assignments] = await Promise.all([
    listStaffWithNames(),
    listHouses(),
    listStaffHouse(),
  ]);

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <SettingsNav />

      <h2 className="mt-6 text-base font-semibold">Assign house staff</h2>
      <p className="text-muted mt-1 mb-3 text-sm">
        House staff see boarding roll, exeat and student records for their
        assigned house(s) only.
      </p>
      <AssignHouseStaffForm staff={staff} houses={houses} />

      <h2 className="mt-8 text-base font-semibold">Current assignments</h2>
      <div className="border-navy/10 mt-2 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Staff</th>
              <th className="px-4 py-2 font-medium">House</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted px-4 py-6 text-center">
                  No house staff assigned yet.
                </td>
              </tr>
            ) : (
              assignments.map((a) => (
                <tr key={a.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">{a.staffName}</td>
                  <td className="px-4 py-2">{a.houseName}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={removeHouseStaff}>
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
