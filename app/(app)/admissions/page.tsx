import Link from "next/link";
import { listApplications } from "@/lib/db/admissions";
import { StatusBadge } from "@/components/status-badge";
import {
  APPLICATION_STATUS_LABELS,
  streamLabel,
  trackLabel,
} from "@/lib/constants";
import { APPLICATION_STATUS_VALUES } from "@/lib/validation/admissions";
import type { Database } from "@/lib/supabase/database.types";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

function isStatus(v: string | undefined): v is ApplicationStatus {
  return !!v && (APPLICATION_STATUS_VALUES as readonly string[]).includes(v);
}

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = isStatus(status) ? status : undefined;
  const applications = await listApplications(active);

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admissions</h1>
        <Link
          href="/admissions/new"
          className="bg-maroon hover:bg-maroon-dark rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          New application
        </Link>
      </div>

      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admissions"
          className={`rounded-full px-3 py-1 ${!active ? "bg-navy text-white" : "bg-cream text-navy"}`}
        >
          All
        </Link>
        {APPLICATION_STATUS_VALUES.map((s) => (
          <Link
            key={s}
            href={`/admissions?status=${s}`}
            className={`rounded-full px-3 py-1 ${active === s ? "bg-navy text-white" : "bg-cream text-navy"}`}
          >
            {APPLICATION_STATUS_LABELS[s]}
          </Link>
        ))}
      </nav>

      <div className="border-navy/10 mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Applicant</th>
              <th className="px-4 py-2 font-medium">Stream</th>
              <th className="px-4 py-2 font-medium">Track</th>
              <th className="px-4 py-2 font-medium">Score</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted px-4 py-8 text-center">
                  No applications{active ? " in this stage" : ""} yet.
                </td>
              </tr>
            ) : (
              applications.map((a) => (
                <tr key={a.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admissions/${a.id}`}
                      className="text-maroon font-medium hover:underline"
                    >
                      {a.person?.full_name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{streamLabel(a.stream)}</td>
                  <td className="px-4 py-2">{trackLabel(a.track)}</td>
                  <td className="px-4 py-2">{a.exam_score ?? "—"}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={a.status} />
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
