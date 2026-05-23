"use client";

import { useActionState } from "react";
import { saveBoardingRoll, type ActionState } from "../actions";
import type { BoardingRosterEntry } from "@/lib/db/boarding";

const initial: ActionState = { error: null };

export function BoardingForm({
  roster,
  houseId,
  date,
  session,
}: {
  roster: BoardingRosterEntry[];
  houseId: string;
  date: string;
  session: string;
}) {
  const [state, action, pending] = useActionState(saveBoardingRoll, initial);

  if (roster.length === 0) {
    return (
      <p className="text-muted mt-4">No boarders assigned to this house yet.</p>
    );
  }

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="house_id" value={houseId} />
      <input type="hidden" name="roll_date" value={date} />
      <input type="hidden" name="session" value={session} />
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
              <th className="px-4 py-2 font-medium">Present</th>
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
                  <input
                    type="checkbox"
                    name={`present_${r.studentId}`}
                    defaultChecked={r.present}
                    className="accent-maroon h-4 w-4"
                  />
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
        {pending ? "Saving…" : "Save roll"}
      </button>
    </form>
  );
}
