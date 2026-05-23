import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/db/fees";
import { RecordPaymentForm } from "./record-payment-form";
import {
  formatCedis,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHODS,
} from "@/lib/constants";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getInvoice(id);
  if (!result) notFound();
  const { invoice, payments } = result;

  const balance = Number(invoice.net_amount) - Number(invoice.amount_paid);
  const methodLabel = (m: string) =>
    PAYMENT_METHODS.find((x) => x.value === m)?.label ?? m;

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/fees" className="text-maroon text-sm hover:underline">
        ← Fees
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          {invoice.student?.person?.full_name ?? "Invoice"}
        </h1>
        <span className="bg-cream text-navy rounded-full px-3 py-1 text-sm">
          {INVOICE_STATUS_LABELS[invoice.status]} · {invoice.term?.name ?? ""}
        </span>
      </div>

      <dl className="border-navy/10 mt-6 grid grid-cols-2 gap-4 rounded-lg border bg-white p-6 text-sm">
        <Detail
          label="Standard fee"
          value={formatCedis(invoice.standard_amount)}
        />
        <Detail label="Discount" value={formatCedis(invoice.discount_amount)} />
        <Detail
          label="Net payable"
          value={formatCedis(invoice.net_amount)}
          strong
        />
        <Detail label="Paid" value={formatCedis(invoice.amount_paid)} />
        <Detail label="Balance" value={formatCedis(balance)} strong />
      </dl>

      <div className="border-navy/10 mt-6 rounded-lg border bg-white p-6">
        <h2 className="text-base font-semibold">Record a payment</h2>
        <p className="text-muted mt-1 mb-4 text-xs">
          Payments are recorded via an audited transaction.
        </p>
        <RecordPaymentForm invoiceId={invoice.id} />
      </div>

      <h2 className="mt-6 text-base font-semibold">Payments</h2>
      <div className="border-navy/10 mt-2 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Method</th>
              <th className="px-4 py-2 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted px-4 py-6 text-center">
                  No payments recorded.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">{p.paid_on}</td>
                  <td className="px-4 py-2">{formatCedis(p.amount)}</td>
                  <td className="px-4 py-2">{methodLabel(p.method)}</td>
                  <td className="px-4 py-2">{p.reference ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Detail({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd
        className={`mt-1 ${strong ? "text-base font-semibold" : "font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}
