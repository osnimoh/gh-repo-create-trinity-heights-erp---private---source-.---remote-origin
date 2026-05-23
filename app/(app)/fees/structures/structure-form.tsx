"use client";

import { useActionState } from "react";
import { upsertFeeStructure, type ActionState } from "../actions";
import { YEAR_GROUPS } from "@/lib/constants";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function FeeStructureForm({
  years,
}: {
  years: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(upsertFeeStructure, initial);

  return (
    <form action={action} className="mt-4 grid max-w-xl gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Academic year</span>
        <select
          name="academic_year_id"
          required
          defaultValue=""
          className={fieldClass}
        >
          <option value="">Choose…</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Year group</span>
          <select name="year_group" defaultValue="shs1" className={fieldClass}>
            {YEAR_GROUPS.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Standard fee (GH₵)</span>
          <input
            type="number"
            name="amount"
            min="0"
            step="0.01"
            required
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Description</span>
        <input name="description" className={fieldClass} />
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
          {pending ? "Saving…" : "Save fee structure"}
        </button>
      </div>
    </form>
  );
}
