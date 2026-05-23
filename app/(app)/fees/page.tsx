import Link from "next/link";
import { getFeesSummary, listInvoices } from "@/lib/db/fees";
import { FeesNav } from "./nav";
import { formatCedis, INVOICE_STATUS_LABELS } from "@/lib/constants";

export default async function FeesPage() {
  const [summary, invoices] = await Promise.all([
    getFeesSummary(),
    listInvoices(),
  ]);

  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">Fees</h1>
      <FeesNav />

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card label="Billed (net)" value={formatCedis(summary.billed)} />
        <Card label="Collected" value={formatCedis(summary.collected)} />
        <Card
          label="Outstanding"
          value={formatCedis(summary.outstanding)}
          tone="maroon"
        />
      </div>

      <div className="border-navy/10 mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">Term</th>
              <th className="px-4 py-2 font-medium">Net</th>
              <th className="px-4 py-2 font-medium">Paid</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted px-4 py-8 text-center">
                  No invoices yet. Generate one to get started.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">
                    <Link
                      href={`/fees/${inv.id}`}
                      className="text-maroon font-medium hover:underline"
                    >
                      {inv.student?.person?.full_name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{inv.term?.name ?? "—"}</td>
                  <td className="px-4 py-2">{formatCedis(inv.net_amount)}</td>
                  <td className="px-4 py-2">{formatCedis(inv.amount_paid)}</td>
                  <td className="px-4 py-2">
                    {INVOICE_STATUS_LABELS[inv.status]}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "maroon";
}) {
  return (
    <div className="border-navy/10 rounded-lg border bg-white p-5">
      <p className="text-muted text-sm">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${tone === "maroon" ? "text-maroon" : "text-navy"}`}
      >
        {value}
      </p>
    </div>
  );
}
