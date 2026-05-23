"use client";

import { useActionState } from "react";
import { enrolApplicant, type ActionState } from "../actions";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function EnrolForm({
  applicationId,
  years,
  houses,
  classes,
}: {
  applicationId: string;
  years: { id: string; name: string; is_current: boolean }[];
  houses: { id: string; name: string }[];
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(enrolApplicant, initial);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="application_id" value={applicationId} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Academic year</span>
        <select
          name="academic_year_id"
          required
          defaultValue=""
          className={fieldClass}
        >
          <option value="">—</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
              {y.is_current ? " (current)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Class (optional)</span>
        <select name="class_id" defaultValue="" className={fieldClass}>
          <option value="">—</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">House (optional)</span>
        <select name="house_id" defaultValue="" className={fieldClass}>
          <option value="">—</option>
          {houses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </label>

      {state.error ? (
        <p role="alert" className="text-maroon text-sm sm:col-span-3">
          {state.error}
        </p>
      ) : null}

      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Enrolling…" : "Enrol & generate admission number"}
        </button>
      </div>
    </form>
  );
}
