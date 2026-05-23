import Link from "next/link";
import { notFound } from "next/navigation";
import { getChildSummary } from "@/lib/db/portal";
import {
  formatCedis,
  INVOICE_STATUS_LABELS,
  streamLabel,
  yearGroupLabel,
} from "@/lib/constants";

export default async function PortalChildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const summary = await getChildSummary(id);
  if (!summary) notFound();
  const { student, invoices, reportCards, attendance } = summary;

  const outstanding = invoices.reduce(
    (sum, i) => sum + (Number(i.net_amount) - Number(i.amount_paid)),
    0,
  );
  const attendanceRate =
    attendance.total > 0
      ? Math.round((attendance.present / attendance.total) * 100)
      : null;

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/portal" className="text-maroon text-sm hover:underline">
        ← Parent Portal
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {student.person?.full_name ?? "Child"}
      </h1>
      <p className="text-muted mt-1">
        {yearGroupLabel(student.year_group)} · {streamLabel(student.stream)} ·{" "}
        {student.admission_no ?? ""}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border-navy/10 rounded-lg border bg-white p-5">
          <p className="text-muted text-sm">Attendance</p>
          <p className="text-navy mt-1 text-xl font-semibold">
            {attendanceRate === null ? "—" : `${attendanceRate}%`}
          </p>
          <p className="text-muted text-xs">
            {attendance.present}/{attendance.total} marks present
          </p>
        </div>
        <div className="border-navy/10 rounded-lg border bg-white p-5">
          <p className="text-muted text-sm">Fees outstanding</p>
          <p className="text-maroon mt-1 text-xl font-semibold">
            {formatCedis(outstanding)}
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-base font-semibold">Fees</h2>
      <div className="border-navy/10 mt-2 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Term</th>
              <th className="px-4 py-2 font-medium">Net</th>
              <th className="px-4 py-2 font-medium">Paid</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted px-4 py-6 text-center">
                  No invoices.
                </td>
              </tr>
            ) : (
              invoices.map((i) => (
                <tr key={i.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">{i.term?.name ?? "—"}</td>
                  <td className="px-4 py-2">{formatCedis(i.net_amount)}</td>
                  <td className="px-4 py-2">{formatCedis(i.amount_paid)}</td>
                  <td className="px-4 py-2">
                    {INVOICE_STATUS_LABELS[i.status]}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-base font-semibold">Report cards</h2>
      <div className="border-navy/10 mt-2 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Term</th>
              <th className="px-4 py-2 font-medium">Average</th>
              <th className="px-4 py-2 font-medium">Grade</th>
            </tr>
          </thead>
          <tbody>
            {reportCards.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted px-4 py-6 text-center">
                  No report cards yet.
                </td>
              </tr>
            ) : (
              reportCards.map((r) => (
                <tr key={r.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">{r.term?.name ?? "—"}</td>
                  <td className="px-4 py-2">{r.overall_average ?? "—"}</td>
                  <td className="px-4 py-2">{r.overall_grade ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
