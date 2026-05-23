"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createApplication, type ActionState } from "../actions";
import { STREAMS, TRACKS, SEXES } from "@/lib/constants";

const initial: ActionState = { error: null };

const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function NewApplicationForm({
  years,
}: {
  years: { id: string; name: string; is_current: boolean }[];
}) {
  const [state, action, pending] = useActionState(createApplication, initial);

  return (
    <form action={action} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-navy font-medium">Full name</span>
        <input name="full_name" required className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Date of birth</span>
        <input type="date" name="date_of_birth" className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Sex</span>
        <select name="sex" defaultValue="" className={fieldClass}>
          <option value="">—</option>
          {SEXES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Email</span>
        <input type="email" name="email" className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Phone</span>
        <input name="phone" className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Stream</span>
        <select name="stream" defaultValue="" className={fieldClass}>
          <option value="">—</option>
          {STREAMS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Track</span>
        <select name="track" defaultValue="" className={fieldClass}>
          <option value="">—</option>
          {TRACKS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-navy font-medium">Intake year</span>
        <select name="academic_year_id" defaultValue="" className={fieldClass}>
          <option value="">—</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
              {y.is_current ? " (current)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-navy font-medium">Notes</span>
        <textarea name="notes" rows={3} className={fieldClass} />
      </label>

      {state.error ? (
        <p role="alert" className="text-maroon text-sm sm:col-span-2">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create application"}
        </button>
        <Link
          href="/admissions"
          className="border-navy/20 hover:bg-cream rounded-md border px-4 py-2 text-sm"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
