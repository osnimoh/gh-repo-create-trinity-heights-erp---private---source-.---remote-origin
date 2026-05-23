"use client";

import { useActionState } from "react";
import { assignHouseStaff, type ActionState } from "../actions";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function AssignHouseStaffForm({
  staff,
  houses,
}: {
  staff: { id: string; name: string }[];
  houses: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(assignHouseStaff, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Staff member</span>
        <select name="staff_id" defaultValue="" required className={fieldClass}>
          <option value="">Choose…</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">House</span>
        <select name="house_id" defaultValue="" required className={fieldClass}>
          <option value="">Choose…</option>
          {houses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Assigning…" : "Assign"}
      </button>
      {state.error ? (
        <p role="alert" className="text-maroon w-full text-sm">
          {state.error}
        </p>
      ) : state.ok ? (
        <p className="text-gold w-full text-sm">Assigned.</p>
      ) : null}
    </form>
  );
}
