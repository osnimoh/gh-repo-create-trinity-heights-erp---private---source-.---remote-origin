import { getCurrentRoles } from "@/lib/auth/session";
import { searchStudents } from "@/lib/db/students";
import { getHealthRecord, listSickBayVisits } from "@/lib/db/health";
import { HealthNav } from "./nav";
import { HealthRecordForm, SickBayVisitForm } from "./health-forms";

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>;
}) {
  const { student_id } = await searchParams;
  const roles = await getCurrentRoles();
  const canManage = roles.includes("admin") || roles.includes("nurse");

  const students = canManage ? await searchStudents() : [];
  const record = student_id ? await getHealthRecord(student_id) : null;
  const visits = student_id ? await listSickBayVisits(student_id) : [];

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Health &amp; Welfare</h1>
      <HealthNav showSafeguarding={roles.includes("dsl")} />

      {!canManage ? (
        <p className="text-muted mt-4">
          Health records are managed by the school nurse.
          {roles.includes("dsl")
            ? " Use the Safeguarding tab for your area."
            : ""}
        </p>
      ) : (
        <>
          <form method="get" className="mt-4 flex items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-navy font-medium">Student</span>
              <select
                name="student_id"
                defaultValue={student_id ?? ""}
                className="border-navy/20 rounded-md border px-3 py-2"
              >
                <option value="">Choose…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.person?.full_name ?? "—"}
                    {s.admission_no ? ` (${s.admission_no})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="bg-navy rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Open
            </button>
          </form>

          {student_id ? (
            <>
              <h2 className="mt-8 text-base font-semibold">Health record</h2>
              <div className="border-navy/10 mt-2 rounded-lg border bg-white p-4">
                <HealthRecordForm studentId={student_id} record={record} />
              </div>

              <h2 className="mt-8 text-base font-semibold">Sick bay visits</h2>
              <div className="border-navy/10 mt-2 overflow-hidden rounded-lg border bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-cream text-navy">
                    <tr>
                      <th className="px-4 py-2 font-medium">When</th>
                      <th className="px-4 py-2 font-medium">Complaint</th>
                      <th className="px-4 py-2 font-medium">Treatment</th>
                      <th className="px-4 py-2 font-medium">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-muted px-4 py-6 text-center"
                        >
                          No visits recorded.
                        </td>
                      </tr>
                    ) : (
                      visits.map((v) => (
                        <tr key={v.id} className="border-navy/5 border-t">
                          <td className="px-4 py-2">
                            {new Date(v.visited_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">{v.complaint ?? "—"}</td>
                          <td className="px-4 py-2">{v.treatment ?? "—"}</td>
                          <td className="px-4 py-2">{v.outcome ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <h2 className="mt-8 text-base font-semibold">Record a visit</h2>
              <div className="border-navy/10 mt-2 rounded-lg border bg-white p-4">
                <SickBayVisitForm studentId={student_id} />
              </div>
            </>
          ) : (
            <p className="text-muted mt-4">
              Choose a student to view their health record.
            </p>
          )}
        </>
      )}
    </section>
  );
}
