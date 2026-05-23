"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createExeat, type ActionState } from "../../actions";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function ExeatForm({
  studentId,
  collectors,
}: {
  studentId: string;
  collectors: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createExeat, initial);

  return (
    <form action={action} className="mt-4 grid max-w-xl gap-4">
      <input type="hidden" name="student_id" value={studentId} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Authorised collector</span>
        <select
          name="collector_guardian_id"
          defaultValue=""
          className={fieldClass}
        >
          <option value="">— none —</option>
          {collectors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {collectors.length === 0 ? (
          <span className="text-muted text-xs">
            This student has no authorised collector on file.
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Reason</span>
        <input name="reason" className={fieldClass} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Departure</span>
          <input
            type="datetime-local"
            name="departure_at"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Expected return</span>
          <input
            type="datetime-local"
            name="expected_return_at"
            className={fieldClass}
          />
        </label>
      </div>

      {state.error ? (
        <p role="alert" className="text-maroon text-sm">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create exeat"}
        </button>
        <Link
          href="/attendance/exeat"
          className="border-navy/20 hover:bg-cream rounded-md border px-4 py-2 text-sm"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
