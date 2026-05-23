import { getCurrentRoles } from "@/lib/auth/session";
import { searchStudents } from "@/lib/db/students";
import { listSafeguardingFlags } from "@/lib/db/health";
import { HealthNav } from "../nav";
import { SafeguardingFlagForm } from "./flag-form";

export default async function SafeguardingPage() {
  const roles = await getCurrentRoles();
  const isDsl = roles.includes("dsl");

  // Belt-and-braces: the page is gated here, but RLS is the real wall — a
  // non-DSL user's queries below return nothing regardless.
  if (!isDsl) {
    return (
      <section className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">Safeguarding</h1>
        <HealthNav showSafeguarding={false} />
        <div className="border-maroon/30 mt-6 rounded-lg border bg-white p-6">
          <p className="text-maroon">
            Safeguarding records are accessible to the Designated Safeguarding
            Lead only.
          </p>
        </div>
      </section>
    );
  }

  const [flags, students] = await Promise.all([
    listSafeguardingFlags(),
    searchStudents(),
  ]);

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Safeguarding</h1>
      <HealthNav showSafeguarding={true} />
      <p className="text-maroon mt-3 text-xs">
        DSL-only. Every access to this data is audited.
      </p>

      <div className="border-navy/10 mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Severity</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Raised</th>
            </tr>
          </thead>
          <tbody>
            {flags.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted px-4 py-6 text-center">
                  No flags recorded.
                </td>
              </tr>
            ) : (
              flags.map((f) => (
                <tr key={f.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">
                    {f.student?.person?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-2">{f.category}</td>
                  <td className="px-4 py-2 capitalize">{f.severity}</td>
                  <td className="px-4 py-2 capitalize">{f.status}</td>
                  <td className="px-4 py-2">
                    {new Date(f.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-base font-semibold">Raise a flag</h2>
      <div className="border-navy/10 mt-2 rounded-lg border bg-white p-4">
        <SafeguardingFlagForm
          students={students.map((s) => ({
            id: s.id,
            label: `${s.person?.full_name ?? "—"}${s.admission_no ? ` (${s.admission_no})` : ""}`,
          }))}
        />
      </div>
    </section>
  );
}
