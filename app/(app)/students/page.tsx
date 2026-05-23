import Link from "next/link";
import { searchStudents } from "@/lib/db/students";
import { streamLabel, yearGroupLabel } from "@/lib/constants";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const students = await searchStudents(q);

  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">Students</h1>

      <form method="get" className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name or admission number…"
          className="border-navy/20 focus:border-maroon focus:ring-maroon/20 w-full max-w-md rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
        />
        <button
          type="submit"
          className="bg-navy rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Search
        </button>
      </form>

      <div className="border-navy/10 mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Admission no.</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Year</th>
              <th className="px-4 py-2 font-medium">Stream</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted px-4 py-8 text-center">
                  {q ? "No students match that search." : "No students yet."}
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2 font-mono text-xs">
                    {s.admission_no ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/students/${s.id}`}
                      className="text-maroon font-medium hover:underline"
                    >
                      {s.person?.full_name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{yearGroupLabel(s.year_group)}</td>
                  <td className="px-4 py-2">{streamLabel(s.stream)}</td>
                  <td className="px-4 py-2 capitalize">{s.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
