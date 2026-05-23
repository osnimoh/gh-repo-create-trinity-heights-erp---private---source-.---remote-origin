"use client";

import { useActionState } from "react";
import { saveAttendance, type ActionState } from "./actions";
import { ATTENDANCE_STATUSES } from "@/lib/constants";
import type { RosterEntry } from "@/lib/db/attendance";
import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["attendance_status"];
const initial: ActionState = { error: null };

export function AttendanceForm({
  roster,
  existing,
  classId,
  date,
  sessionType,
}: {
  roster: RosterEntry[];
  existing: Record<string, Status>;
  classId: string;
  date: string;
  sessionType: string;
}) {
  const [state, action, pending] = useActionState(saveAttendance, initial);

  if (roster.length === 0) {
    return (
      <p className="text-muted mt-4">
        No students are placed in this class yet.
      </p>
    );
  }

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="class_id" value={classId} />
      <input type="hidden" name="session_date" value={date} />
      <input type="hidden" name="session_type" value={sessionType} />
      <input
        type="hidden"
        name="student_ids"
        value={JSON.stringify(roster.map((r) => r.studentId))}
      />

      <div className="border-navy/10 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.studentId} className="border-navy/5 border-t">
                <td className="px-4 py-2">
                  {r.fullName}
                  <span className="text-muted ml-2 font-mono text-xs">
                    {r.admissionNo ?? ""}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <select
                    name={`status_${r.studentId}`}
                    defaultValue={existing[r.studentId] ?? "present"}
                    className="border-navy/20 rounded-md border px-2 py-1"
                  >
                    {ATTENDANCE_STATUSES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.error ? (
        <p role="alert" className="text-maroon mt-3 text-sm">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-maroon hover:bg-maroon-dark mt-4 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save attendance"}
      </button>
    </form>
  );
}
