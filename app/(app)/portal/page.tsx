import Link from "next/link";
import { getMyChildren } from "@/lib/db/portal";
import { streamLabel, yearGroupLabel } from "@/lib/constants";

export default async function PortalPage() {
  const children = await getMyChildren();

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Parent Portal</h1>
      <p className="text-muted mt-1">Your children at Trinity Heights.</p>

      <div className="mt-6 grid gap-3">
        {children.length === 0 ? (
          <p className="text-muted">
            No children are linked to your account yet. Please contact the
            school office.
          </p>
        ) : (
          children.map((c) => (
            <Link
              key={c.id}
              href={`/portal/${c.id}`}
              className="border-navy/10 hover:border-maroon rounded-lg border bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-navy font-medium">
                  {c.person?.full_name ?? "—"}
                </span>
                <span className="text-muted font-mono text-xs">
                  {c.admission_no ?? ""}
                </span>
              </div>
              <p className="text-muted mt-1 text-sm">
                {yearGroupLabel(c.year_group)} · {streamLabel(c.stream)}
              </p>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
