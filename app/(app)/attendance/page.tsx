import { listClasses } from "@/lib/db/admissions";
import {
  getClassRoster,
  getExistingMarks,
  listRecentSessions,
} from "@/lib/db/attendance";
import { AttendanceForm } from "./attendance-form";
import { AttendanceNav } from "./nav";
import { ATTENDANCE_SESSION_TYPES } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";

type SessionType = Database["public"]["Enums"]["attendance_session_type"];

function isSessionType(v: string | undefined): v is SessionType {
  return v === "morning" || v === "afternoon" || v === "prep";
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    class_id?: string;
    date?: string;
    session_type?: string;
  }>;
}) {
  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = sp.date || today;
  const sessionType: SessionType = isSessionType(sp.session_type)
    ? sp.session_type
    : "morning";

  const [classes, recent] = await Promise.all([
    listClasses(),
    listRecentSessions(),
  ]);

  const classId = sp.class_id;
  const [roster, existing] = classId
    ? await Promise.all([
        getClassRoster(classId),
        getExistingMarks(classId, date, sessionType),
      ])
    : [[], {}];

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Attendance</h1>
      <AttendanceNav />

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Class</span>
          <select
            name="class_id"
            defaultValue={classId ?? ""}
            className="border-navy/20 rounded-md border px-3 py-2"
          >
            <option value="">Choose…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="border-navy/20 rounded-md border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Session</span>
          <select
            name="session_type"
            defaultValue={sessionType}
            className="border-navy/20 rounded-md border px-3 py-2"
          >
            {ATTENDANCE_SESSION_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-navy rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Load roster
        </button>
      </form>

      {classId ? (
        <AttendanceForm
          roster={roster}
          existing={existing}
          classId={classId}
          date={date}
          sessionType={sessionType}
        />
      ) : (
        <p className="text-muted mt-4">Choose a class to take the register.</p>
      )}

      <h2 className="mt-10 text-base font-semibold">Recent sessions</h2>
      <div className="border-navy/10 mt-2 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Class</th>
              <th className="px-4 py-2 font-medium">Session</th>
              <th className="px-4 py-2 font-medium">Marked</th>
              <th className="px-4 py-2 font-medium">Absent</th>
              <th className="px-4 py-2 font-medium">Late</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted px-4 py-8 text-center">
                  No sessions recorded yet.
                </td>
              </tr>
            ) : (
              recent.map((s) => (
                <tr key={s.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">{s.sessionDate}</td>
                  <td className="px-4 py-2">{s.className}</td>
                  <td className="px-4 py-2 capitalize">{s.sessionType}</td>
                  <td className="px-4 py-2">{s.total}</td>
                  <td className="px-4 py-2">{s.absent}</td>
                  <td className="px-4 py-2">{s.late}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
