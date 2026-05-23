import { searchStudents } from "@/lib/db/students";
import { listAcademicYears } from "@/lib/db/admissions";
import { ScholarshipForm } from "./scholarship-form";
import { FeesNav } from "../nav";

export default async function ScholarshipsPage() {
  const [students, years] = await Promise.all([
    searchStudents(),
    listAcademicYears(),
  ]);

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Fees</h1>
      <FeesNav />
      <h2 className="mt-6 text-base font-semibold">Add a scholarship</h2>
      <p className="text-muted mt-1 text-sm">
        Scholarships are applied when an invoice is generated. The 10% net-fee
        floor always holds, no matter how they stack.
      </p>
      <ScholarshipForm
        students={students.map((s) => ({
          id: s.id,
          label: `${s.person?.full_name ?? "—"}${s.admission_no ? ` (${s.admission_no})` : ""}`,
        }))}
        years={years.map((y) => ({ id: y.id, name: y.name }))}
      />
    </section>
  );
}
