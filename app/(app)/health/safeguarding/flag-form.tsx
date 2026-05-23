"use client";

import { useActionState } from "react";
import { createSafeguardingFlag, type ActionState } from "../actions";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function SafeguardingFlagForm({
  students,
}: {
  students: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(
    createSafeguardingFlag,
    initial,
  );
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-navy font-medium">Student</span>
        <select
          name="student_id"
          required
          defaultValue=""
          className={fieldClass}
        >
          <option value="">Choose…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Category</span>
        <input name="category" required className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Severity</span>
        <select name="severity" defaultValue="low" className={fieldClass}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-navy font-medium">Details</span>
        <textarea name="details" rows={3} className={fieldClass} />
      </label>
      {state.error ? (
        <p role="alert" className="text-maroon text-sm sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Raise flag"}
        </button>
      </div>
    </form>
  );
}
