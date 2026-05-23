import { EXPORTERS } from "@/lib/exports";

export default function ExportsPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Exports</h1>
      <p className="text-muted mt-2">
        Government and exam-body exports. These are <strong>scaffolds</strong> —
        the column formats are not yet confirmed and must not be submitted until
        verified against the official specifications.
      </p>

      <div className="mt-6 space-y-4">
        {EXPORTERS.map((e) => (
          <div
            key={e.key}
            className="border-navy/10 rounded-lg border bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-navy font-medium">{e.label}</h2>
              <span className="bg-gold/20 text-navy rounded-full px-2 py-0.5 text-xs">
                {e.status === "scaffold" ? "Scaffold — not live" : "Confirmed"}
              </span>
            </div>
            <p className="text-muted mt-2 text-xs">
              Confirm against: {e.confirmSource}
            </p>
            <p className="text-muted mt-2 text-xs">
              Columns: <code>{e.headers.join(", ")}</code>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
