"use client";

import { useActionState } from "react";
import { addTimetableEntry, type ActionState } from "../actions";
import { DAYS_OF_WEEK } from "@/lib/constants";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function TimetableForm({
  classId,
  subjects,
}: {
  classId: string;
  subjects: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(addTimetableEntry, initial);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="class_id" value={classId} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Day</span>
        <select name="day_of_week" defaultValue="1" className={fieldClass}>
          {DAYS_OF_WEEK.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Period</span>
        <input
          type="number"
          name="period_no"
          min="1"
          defaultValue={1}
          required
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Subject</span>
        <select name="subject_id" defaultValue="" className={fieldClass}>
          <option value="">—</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Room</span>
        <input name="room" className={fieldClass} />
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
          {pending ? "Saving…" : "Add / update slot"}
        </button>
      </div>
    </form>
  );
}
