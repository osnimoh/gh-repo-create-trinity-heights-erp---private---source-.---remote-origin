"use client";

import { useActionState } from "react";
import { createScholarship, type ActionState } from "../actions";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function ScholarshipForm({
  students,
  years,
}: {
  students: { id: string; label: string }[];
  years: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createScholarship, initial);

  return (
    <form action={action} className="mt-4 grid max-w-xl gap-4">
      <label className="flex flex-col gap-1 text-sm">
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
        <span className="text-navy font-medium">Name</span>
        <input name="name" required className={fieldClass} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Kind</span>
          <select name="kind" defaultValue="percentage" className={fieldClass}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (GH₵)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Value</span>
          <input
            type="number"
            name="value"
            min="0"
            step="0.01"
            required
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Academic year (optional)</span>
        <select name="academic_year_id" defaultValue="" className={fieldClass}>
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </select>
      </label>

      {state.error ? (
        <p role="alert" className="text-maroon text-sm">
          {state.error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Add scholarship"}
        </button>
      </div>
    </form>
  );
}
