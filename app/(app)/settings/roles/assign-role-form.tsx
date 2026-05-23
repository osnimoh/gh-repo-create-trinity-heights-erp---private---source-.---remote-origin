"use client";

import { useActionState } from "react";
import { assignRole, type ActionState } from "../actions";
import { APP_ROLES, roleLabel } from "@/lib/auth/roles";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function AssignRoleForm() {
  const [state, action, pending] = useActionState(assignRole, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">User email</span>
        <input type="email" name="email" required className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Role</span>
        <select name="role" defaultValue="" required className={fieldClass}>
          <option value="">Choose…</option>
          {APP_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Assigning…" : "Assign role"}
      </button>
      {state.error ? (
        <p role="alert" className="text-maroon w-full text-sm">
          {state.error}
        </p>
      ) : state.ok ? (
        <p className="text-gold w-full text-sm">Role assigned.</p>
      ) : null}
    </form>
  );
}
