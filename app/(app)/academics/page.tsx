import Link from "next/link";
import { AcademicsNav } from "./nav";
import { NewAssessmentForm } from "./new-assessment-form";
import { ResultsForm } from "./results-form";
import {
  listAssessments,
  listClassSubjects,
  getResultRoster,
} from "@/lib/db/academics";
import { listTerms } from "@/lib/db/fees";

export default async function AcademicsPage({
  searchParams,
}: {
  searchParams: Promise<{ class_subject_id?: string; assessment_id?: string }>;
}) {
  const { class_subject_id, assessment_id } = await searchParams;

  const [classSubjects, terms] = await Promise.all([
    listClassSubjects(),
    listTerms(),
  ]);

  const assessments = class_subject_id
    ? await listAssessments(class_subject_id)
    : [];
  const rosterData = assessment_id
    ? await getResultRoster(assessment_id)
    : null;

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Academics</h1>
      <AcademicsNav />

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Class subject</span>
          <select
            name="class_subject_id"
            defaultValue={class_subject_id ?? ""}
            className="border-navy/20 rounded-md border px-3 py-2"
          >
            <option value="">Choose…</option>
            {classSubjects.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-navy rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Load
        </button>
      </form>

      {class_subject_id ? (
        <>
          <h2 className="mt-8 text-base font-semibold">Assessments</h2>
          <div className="border-navy/10 mt-2 overflow-hidden rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-navy">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Term</th>
                  <th className="px-4 py-2 font-medium">Max</th>
                  <th className="px-4 py-2 font-medium">Weight</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {assessments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted px-4 py-6 text-center"
                    >
                      No assessments yet.
                    </td>
                  </tr>
                ) : (
                  assessments.map((a) => (
                    <tr key={a.id} className="border-navy/5 border-t">
                      <td className="px-4 py-2">{a.name}</td>
                      <td className="px-4 py-2">{a.term?.name ?? "—"}</td>
                      <td className="px-4 py-2">{a.max_score}</td>
                      <td className="px-4 py-2">{a.weight}</td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/academics?class_subject_id=${class_subject_id}&assessment_id=${a.id}`}
                          className="text-maroon font-medium hover:underline"
                        >
                          Enter results
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mt-8 text-base font-semibold">New assessment</h2>
          <div className="border-navy/10 mt-2 rounded-lg border bg-white p-4">
            <NewAssessmentForm
              classSubjectId={class_subject_id}
              terms={terms.map((t) => ({
                id: t.id,
                label: `${t.academic_year?.name ?? ""} · ${t.name ?? `Term ${t.number}`}`,
              }))}
            />
          </div>
        </>
      ) : (
        <p className="text-muted mt-4">
          Choose a class subject to manage assessments and enter results.
        </p>
      )}

      {rosterData ? (
        <>
          <h2 className="mt-8 text-base font-semibold">Enter results</h2>
          <ResultsForm
            assessmentId={assessment_id!}
            maxScore={rosterData.maxScore}
            roster={rosterData.roster}
          />
        </>
      ) : null}
    </section>
  );
}
