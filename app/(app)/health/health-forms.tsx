"use client";

import { useActionState } from "react";
import { addSickBayVisit, saveHealthRecord, type ActionState } from "./actions";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

type HealthRecord = {
  blood_group: string | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  notes: string | null;
} | null;

export function HealthRecordForm({
  studentId,
  record,
}: {
  studentId: string;
  record: HealthRecord;
}) {
  const [state, action, pending] = useActionState(saveHealthRecord, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="student_id" value={studentId} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Blood group</span>
        <input
          name="blood_group"
          defaultValue={record?.blood_group ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Allergies</span>
        <input
          name="allergies"
          defaultValue={record?.allergies ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-navy font-medium">Conditions</span>
        <input
          name="conditions"
          defaultValue={record?.conditions ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-navy font-medium">Medications</span>
        <input
          name="medications"
          defaultValue={record?.medications ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-navy font-medium">Notes</span>
        <textarea
          name="notes"
          rows={2}
          defaultValue={record?.notes ?? ""}
          className={fieldClass}
        />
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
          className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save health record"}
        </button>
      </div>
    </form>
  );
}

export function SickBayVisitForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState(addSickBayVisit, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="student_id" value={studentId} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Complaint</span>
        <input name="complaint" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Treatment</span>
        <input name="treatment" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Outcome</span>
        <input name="outcome" className={fieldClass} />
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
          className="bg-navy rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Recording…" : "Record visit"}
        </button>
      </div>
    </form>
  );
}
