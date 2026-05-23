import Link from "next/link";
import { notFound } from "next/navigation";
import { getExeat } from "@/lib/db/exeat";
import { setExeatStatus } from "../../actions";
import { EXEAT_STATUS_LABELS, EXEAT_TRANSITIONS } from "@/lib/constants";

export default async function ExeatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exeat = await getExeat(id);
  if (!exeat) notFound();

  const transitions = EXEAT_TRANSITIONS[exeat.status];

  return (
    <section className="mx-auto max-w-2xl">
      <Link
        href="/attendance/exeat"
        className="text-maroon text-sm hover:underline"
      >
        ← Exeat list
      </Link>

      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {exeat.student?.person?.full_name ?? "Student"}
        </h1>
        <span className="bg-cream text-navy rounded-full px-3 py-1 text-sm">
          {EXEAT_STATUS_LABELS[exeat.status]}
        </span>
      </div>

      <dl className="border-navy/10 mt-6 grid grid-cols-2 gap-4 rounded-lg border bg-white p-6 text-sm">
        <Detail
          label="Collector"
          value={exeat.collector?.person?.full_name ?? "—"}
        />
        <Detail
          label="Collector phone"
          value={exeat.collector?.person?.phone ?? "—"}
        />
        <Detail label="Reason" value={exeat.reason ?? "—"} />
        <Detail
          label="Departure"
          value={
            exeat.departure_at
              ? new Date(exeat.departure_at).toLocaleString()
              : "—"
          }
        />
        <Detail
          label="Expected return"
          value={
            exeat.expected_return_at
              ? new Date(exeat.expected_return_at).toLocaleString()
              : "—"
          }
        />
        <Detail
          label="Actual return"
          value={
            exeat.actual_return_at
              ? new Date(exeat.actual_return_at).toLocaleString()
              : "—"
          }
        />
      </dl>

      {transitions.length > 0 ? (
        <div className="border-navy/10 mt-6 rounded-lg border bg-white p-6">
          <h2 className="text-base font-semibold">Update status</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {transitions.map((s) => (
              <form key={s} action={setExeatStatus}>
                <input type="hidden" name="exeat_id" value={exeat.id} />
                <input type="hidden" name="status" value={s} />
                <button
                  type="submit"
                  className="border-navy/20 hover:bg-cream rounded-md border px-4 py-2 text-sm"
                >
                  Mark as {EXEAT_STATUS_LABELS[s]}
                </button>
              </form>
            ))}
          </div>
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
