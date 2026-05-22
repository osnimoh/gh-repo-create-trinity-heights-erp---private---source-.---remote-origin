// Empty module shells for Workstream 1. Each is replaced by its real feature in
// the workstream noted.
export function ModulePlaceholder({
  title,
  blurb,
  workstream,
}: {
  title: string;
  blurb: string;
  workstream: string;
}) {
  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted mt-2">{blurb}</p>
      <div className="border-navy/20 text-muted mt-6 rounded-lg border border-dashed bg-white p-6 text-sm">
        Coming in {workstream}.
      </div>
    </section>
  );
}
