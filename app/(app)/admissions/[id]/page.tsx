import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getApplication,
  listAcademicYears,
  listHouses,
  listClasses,
} from "@/lib/db/admissions";
import { StatusBadge } from "@/components/status-badge";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_TRANSITIONS,
  streamLabel,
  trackLabel,
} from "@/lib/constants";
import { recordExamScore, setApplicationStatus } from "../actions";
import { EnrolForm } from "./enrol-form";

const fieldClass =
  "rounded-md border border-navy/20 px-3 py-2 outline-none focus:border-maroon focus:ring-2 focus:ring-maroon/20";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  const status = application.status;
  const buttonTransitions = APPLICATION_TRANSITIONS[status].filter(
    (s) => s !== "enrolled" && s !== "exam_taken",
  );

  const showExamForm = status === "submitted" || status === "exam_taken";
  const showEnrol = status === "accepted";

  const [years, houses, classes] = showEnrol
    ? await Promise.all([listAcademicYears(), listHouses(), listClasses()])
    : [[], [], []];

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/admissions" className="text-maroon text-sm hover:underline">
        ← Admissions
      </Link>

      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {application.person?.full_name ?? "Applicant"}
        </h1>
        <StatusBadge status={status} />
      </div>

      <dl className="border-navy/10 mt-6 grid grid-cols-2 gap-4 rounded-lg border bg-white p-6 text-sm">
        <Detail label="Stream" value={streamLabel(application.stream)} />
        <Detail label="Track" value={trackLabel(application.track)} />
        <Detail
          label="Exam score"
          value={application.exam_score?.toString() ?? "—"}
        />
        <Detail label="Submitted" value={application.submitted_on} />
        <Detail label="Email" value={application.person?.email ?? "—"} />
        <Detail label="Phone" value={application.person?.phone ?? "—"} />
        {application.notes ? (
          <div className="col-span-2">
            <dt className="text-muted">Notes</dt>
            <dd className="mt-1">{application.notes}</dd>
          </div>
        ) : null}
      </dl>

      {showExamForm ? (
        <div className="border-navy/10 mt-6 rounded-lg border bg-white p-6">
          <h2 className="text-base font-semibold">Entrance exam</h2>
          <form action={recordExamScore} className="mt-3 flex items-end gap-3">
            <input type="hidden" name="application_id" value={application.id} />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-navy font-medium">Score (0–100)</span>
              <input
                type="number"
                name="exam_score"
                min={0}
                max={100}
                step="0.01"
                defaultValue={application.exam_score ?? ""}
                required
                className={fieldClass}
              />
            </label>
            <button
              type="submit"
              className="bg-navy rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Record score
            </button>
          </form>
        </div>
      ) : null}

      {buttonTransitions.length > 0 ? (
        <div className="border-navy/10 mt-6 rounded-lg border bg-white p-6">
          <h2 className="text-base font-semibold">Move application</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {buttonTransitions.map((s) => (
              <form key={s} action={setApplicationStatus}>
                <input
                  type="hidden"
                  name="application_id"
                  value={application.id}
                />
                <input type="hidden" name="status" value={s} />
                <button
                  type="submit"
                  className="border-navy/20 hover:bg-cream rounded-md border px-4 py-2 text-sm"
                >
                  Mark as {APPLICATION_STATUS_LABELS[s]}
                </button>
              </form>
            ))}
          </div>
        </div>
      ) : null}

      {showEnrol ? (
        <div className="border-gold/40 mt-6 rounded-lg border bg-white p-6">
          <h2 className="text-base font-semibold">Enrol applicant</h2>
          <p className="text-muted mt-1 mb-4 text-sm">
            Creates the student record and a unique admission number.
          </p>
          <EnrolForm
            applicationId={application.id}
            years={years}
            houses={houses}
            classes={classes}
          />
        </div>
      ) : null}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
