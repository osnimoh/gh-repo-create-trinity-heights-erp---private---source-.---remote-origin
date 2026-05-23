"use client";

import { useActionState } from "react";
import { recordPayment, type ActionState } from "../actions";
import { PAYMENT_METHODS } from "@/lib/constants";

const initial: ActionState = { error: null };
const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export function RecordPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, action, pending] = useActionState(recordPayment, initial);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="invoice_id" value={invoiceId} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Amount (GH₵)</span>
        <input
          type="number"
          name="amount"
          min="0.01"
          step="0.01"
          required
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Method</span>
        <select name="method" defaultValue="momo" className={fieldClass}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Reference</span>
        <input name="reference" className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Paid on</span>
        <input type="date" name="paid_on" className={fieldClass} />
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
          {pending ? "Recording…" : "Record payment"}
        </button>
      </div>
    </form>
  );
}
