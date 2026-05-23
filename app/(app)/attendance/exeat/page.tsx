import Link from "next/link";
import { listExeats } from "@/lib/db/exeat";
import { AttendanceNav } from "../nav";
import { EXEAT_STATUS_LABELS } from "@/lib/constants";

export default async function ExeatListPage() {
  const exeats = await listExeats();

  return (
    <section className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <Link
          href="/attendance/exeat/new"
          className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          New exeat
        </Link>
      </div>
      <AttendanceNav />

      <div className="border-navy/10 mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">Reason</th>
              <th className="px-4 py-2 font-medium">Departs</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {exeats.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted px-4 py-8 text-center">
                  No exeats recorded.
                </td>
              </tr>
            ) : (
              exeats.map((e) => (
                <tr key={e.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">
                    <Link
                      href={`/attendance/exeat/${e.id}`}
                      className="text-maroon font-medium hover:underline"
                    >
                      {e.student?.person?.full_name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{e.reason ?? "—"}</td>
                  <td className="px-4 py-2">
                    {e.departure_at
                      ? new Date(e.departure_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{EXEAT_STATUS_LABELS[e.status]}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
