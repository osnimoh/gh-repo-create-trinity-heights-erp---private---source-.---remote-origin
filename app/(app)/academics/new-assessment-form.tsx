"use client";

import { useActionState } from "react";
import { createAssessment, type ActionState } from "./actions";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function NewAssessmentForm({
  classSubjectId,
  terms,
}: {
  classSubjectId: string;
  terms: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(createAssessment, initial);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="class_subject_id" value={classSubjectId} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Name</span>
        <input name="name" required className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Term</span>
        <select name="term_id" required defaultValue="" className={fieldClass}>
          <option value="">Choose…</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Max score</span>
        <input
          type="number"
          name="max_score"
          min="1"
          step="0.01"
          defaultValue={100}
          required
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Weight</span>
        <input
          type="number"
          name="weight"
          min="0"
          step="0.01"
          defaultValue={1}
          required
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Date</span>
        <input type="date" name="assessment_date" className={fieldClass} />
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
          className="bg-navy rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add assessment"}
        </button>
      </div>
    </form>
  );
}
