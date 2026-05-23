"use client";

import { useActionState } from "react";
import { saveResults, type ActionState } from "./actions";
import type { ResultRosterEntry } from "@/lib/db/academics";

const initial: ActionState = { error: null };

export function ResultsForm({
  assessmentId,
  maxScore,
  roster,
}: {
  assessmentId: string;
  maxScore: number;
  roster: ResultRosterEntry[];
}) {
  const [state, action, pending] = useActionState(saveResults, initial);

  if (roster.length === 0) {
    return (
      <p className="text-muted mt-4">No students are placed in this class.</p>
    );
  }

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="assessment_id" value={assessmentId} />
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
              <th className="px-4 py-2 font-medium">Score (max {maxScore})</th>
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
                    type="number"
                    name={`score_${r.studentId}`}
                    min={0}
                    max={maxScore}
                    step="0.01"
                    defaultValue={r.score ?? ""}
                    className="border-navy/20 w-28 rounded-md border px-2 py-1"
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
        {pending ? "Saving…" : "Save results"}
      </button>
    </form>
  );
}
