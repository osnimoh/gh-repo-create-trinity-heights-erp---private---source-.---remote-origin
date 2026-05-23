import { searchStudents } from "@/lib/db/students";
import { listTerms } from "@/lib/db/fees";
import { GenerateInvoiceForm } from "./generate-form";
import { FeesNav } from "../nav";

export default async function GenerateInvoicePage() {
  const [students, terms] = await Promise.all([searchStudents(), listTerms()]);

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Fees</h1>
      <FeesNav />
      <h2 className="mt-6 text-base font-semibold">Generate invoice</h2>
      <p className="text-muted mt-1 text-sm">
        Applies the student&apos;s active scholarships and enforces the 10%
        net-fee floor.
      </p>
      <GenerateInvoiceForm
        students={students.map((s) => ({
          id: s.id,
          label: `${s.person?.full_name ?? "—"}${s.admission_no ? ` (${s.admission_no})` : ""}`,
        }))}
        terms={terms.map((t) => ({
          id: t.id,
          label: `${t.academic_year?.name ?? ""} · ${t.name ?? `Term ${t.number}`}`,
        }))}
      />
    </section>
  );
}
