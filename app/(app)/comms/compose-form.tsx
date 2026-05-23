"use client";

import { useActionState } from "react";
import { composeMessage, type ActionState } from "./actions";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function ComposeForm({
  classes,
}: {
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(composeMessage, initial);

  return (
    <form action={action} className="grid gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Subject</span>
        <input name="subject" required className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Message</span>
        <textarea name="body" rows={4} required className={fieldClass} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Audience</span>
          <select
            name="audience"
            defaultValue="all_parents"
            className={fieldClass}
          >
            <option value="all_parents">All parents</option>
            <option value="all_staff">All staff</option>
            <option value="class">A class</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">
            Class (if class audience)
          </span>
          <select name="class_id" defaultValue="" className={fieldClass}>
            <option value="">—</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="send_email" className="accent-maroon" />
          Also email
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="send_sms" className="accent-maroon" />
          Also SMS
        </label>
      </div>

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
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
