"use client";

import { useActionState } from "react";
import { createClassSubject, type ActionState } from "../actions";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function ClassSubjectForm({
  classes,
  subjects,
  staff,
}: {
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  staff: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createClassSubject, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Class</span>
        <select name="class_id" defaultValue="" required className={fieldClass}>
          <option value="">Choose…</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Subject</span>
        <select
          name="subject_id"
          defaultValue=""
          required
          className={fieldClass}
        >
          <option value="">Choose…</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Teacher (optional)</span>
        <select name="teacher_staff_id" defaultValue="" className={fieldClass}>
          <option value="">— unassigned —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Assign subject"}
      </button>
      {state.error ? (
        <p role="alert" className="text-maroon w-full text-sm">
          {state.error}
        </p>
      ) : state.ok ? (
        <p className="text-gold w-full text-sm">Saved.</p>
      ) : null}
    </form>
  );
}
