import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentProfile } from "@/lib/db/students";
import { streamLabel, trackLabel, yearGroupLabel } from "@/lib/constants";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "guardians", label: "Guardians" },
  { key: "enrolment", label: "Enrolment history" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const profile = await getStudentProfile(id);
  if (!profile) notFound();

  const active: TabKey = TABS.find((t) => t.key === tab)?.key ?? "overview";
  const { student, guardians, enrolments } = profile;

  return (
    <section className="mx-auto max-w-3xl">
      <Link href="/students" className="text-maroon text-sm hover:underline">
        ← Students
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          {student.person?.full_name ?? "Student"}
        </h1>
        <span className="text-muted font-mono text-sm">
          {student.admission_no ?? "no admission no."}
        </span>
      </div>

      <nav className="border-navy/10 mt-4 flex gap-1 border-b text-sm">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/students/${id}?tab=${t.key}`}
            className={`-mb-px border-b-2 px-3 py-2 ${
              active === t.key
                ? "border-maroon text-maroon font-medium"
                : "text-muted hover:text-navy border-transparent"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {active === "overview" ? (
          <dl className="border-navy/10 grid grid-cols-2 gap-4 rounded-lg border bg-white p-6 text-sm">
            <Detail label="Status" value={student.status} />
            <Detail
              label="Year group"
              value={yearGroupLabel(student.year_group)}
            />
            <Detail label="Stream" value={streamLabel(student.stream)} />
            <Detail label="Track" value={trackLabel(student.track)} />
            <Detail
              label="Date of birth"
              value={student.person?.date_of_birth ?? "—"}
            />
            <Detail label="Sex" value={student.person?.sex ?? "—"} />
            <Detail label="Email" value={student.person?.email ?? "—"} />
            <Detail label="Phone" value={student.person?.phone ?? "—"} />
          </dl>
        ) : null}

        {active === "guardians" ? (
          <div className="space-y-3">
            {guardians.length === 0 ? (
              <p className="text-muted">No guardians linked.</p>
            ) : (
              guardians.map((g) => (
                <div
                  key={g.id}
                  className="border-navy/10 rounded-lg border bg-white p-4 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {g.guardian?.person?.full_name ?? "—"}
                      {g.relationship ? (
                        <span className="text-muted ml-2 capitalize">
                          ({g.relationship.replace("_", "/")})
                        </span>
                      ) : null}
                    </p>
                    {g.is_primary ? (
                      <span className="bg-gold/20 text-navy rounded-full px-2 py-0.5 text-xs">
                        Primary
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted mt-1">
                    {g.guardian?.person?.phone ?? "—"} ·{" "}
                    {g.guardian?.person?.email ?? "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {g.is_authorised_collector ? (
                      <span className="bg-cream rounded px-2 py-0.5">
                        Authorised collector
                      </span>
                    ) : null}
                    {g.can_top_up_wallet ? (
                      <span className="bg-cream rounded px-2 py-0.5">
                        Can top up wallet
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {active === "enrolment" ? (
          <div className="border-navy/10 overflow-hidden rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-navy">
                <tr>
                  <th className="px-4 py-2 font-medium">Year</th>
                  <th className="px-4 py-2 font-medium">Class</th>
                  <th className="px-4 py-2 font-medium">House</th>
                  <th className="px-4 py-2 font-medium">Enrolled</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {enrolments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted px-4 py-8 text-center"
                    >
                      No enrolment records.
                    </td>
                  </tr>
                ) : (
                  enrolments.map((e) => (
                    <tr key={e.id} className="border-navy/5 border-t">
                      <td className="px-4 py-2">
                        {e.academic_year?.name ?? "—"}
                      </td>
                      <td className="px-4 py-2">{e.class?.name ?? "—"}</td>
                      <td className="px-4 py-2">{e.house?.name ?? "—"}</td>
                      <td className="px-4 py-2">{e.enrolled_on}</td>
                      <td className="px-4 py-2 capitalize">{e.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-medium capitalize">{value}</dd>
    </div>
  );
}
