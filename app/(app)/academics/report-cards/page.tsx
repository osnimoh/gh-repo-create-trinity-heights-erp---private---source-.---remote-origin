import { AcademicsNav } from "../nav";
import { GenerateReportCardForm } from "./generate-form";
import { getReportCard } from "@/lib/db/academics";
import { searchStudents } from "@/lib/db/students";
import { listTerms } from "@/lib/db/fees";

type SubjectLine = {
  subject: string;
  percent: number | null;
  grade: string | null;
};

export default async function ReportCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; term_id?: string }>;
}) {
  const { student_id, term_id } = await searchParams;

  const [students, terms] = await Promise.all([searchStudents(), listTerms()]);
  const card =
    student_id && term_id ? await getReportCard(student_id, term_id) : null;

  const subjects: SubjectLine[] = card
    ? ((card.subjects as unknown as SubjectLine[]) ?? [])
    : [];

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Academics</h1>
      <AcademicsNav />

      <div className="border-navy/10 mt-4 rounded-lg border bg-white p-4">
        <GenerateReportCardForm
          students={students.map((s) => ({
            id: s.id,
            label: `${s.person?.full_name ?? "—"}${s.admission_no ? ` (${s.admission_no})` : ""}`,
          }))}
          terms={terms.map((t) => ({
            id: t.id,
            label: `${t.academic_year?.name ?? ""} · ${t.name ?? `Term ${t.number}`}`,
          }))}
          defaultStudentId={student_id}
          defaultTermId={term_id}
        />
      </div>

      {card ? (
        <div className="border-navy/10 mt-6 rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-navy font-serif text-lg">
                {card.student?.person?.full_name ?? "Student"}
              </h2>
              <p className="text-muted text-sm">{card.term?.name ?? ""}</p>
            </div>
            <div className="text-right">
              <p className="text-muted text-sm">Overall</p>
              <p className="text-maroon text-xl font-semibold">
                {card.overall_average ?? "—"}
                {card.overall_grade ? ` · ${card.overall_grade}` : ""}
              </p>
            </div>
          </div>

          <table className="mt-4 w-full text-left text-sm">
            <thead className="bg-cream text-navy">
              <tr>
                <th className="px-4 py-2 font-medium">Subject</th>
                <th className="px-4 py-2 font-medium">Percent</th>
                <th className="px-4 py-2 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-muted px-4 py-6 text-center">
                    No subject results.
                  </td>
                </tr>
              ) : (
                subjects.map((s) => (
                  <tr key={s.subject} className="border-navy/5 border-t">
                    <td className="px-4 py-2">{s.subject}</td>
                    <td className="px-4 py-2">{s.percent ?? "—"}</td>
                    <td className="px-4 py-2">{s.grade ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : student_id && term_id ? (
        <p className="text-muted mt-6">
          No report card found — generate one above.
        </p>
      ) : null}
    </section>
  );
}
