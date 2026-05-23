"use client";

import { useActionState } from "react";
import { generateInvoice, type ActionState } from "../actions";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function GenerateInvoiceForm({
  students,
  terms,
}: {
  students: { id: string; label: string }[];
  terms: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(generateInvoice, initial);

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
          {pending ? "Generating…" : "Generate invoice"}
        </button>
      </div>
    </form>
  );
}
