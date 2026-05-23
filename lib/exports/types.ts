import { buildCsv } from "./csv";

// Government/exam-body exports live behind this interface so the real column
// formats can be confirmed and slotted in without touching callers.
//
// SCAFFOLD ONLY: the EMIS/Annual-Census and WAEC layouts are NOT confirmed.
// `status: "scaffold"` exporters MUST NOT be treated as submission-ready.
export type ExporterStatus = "scaffold" | "confirmed";

export interface Exporter<T> {
  key: string;
  label: string;
  status: ExporterStatus;
  /** Official source/spec to confirm against before going live. */
  confirmSource: string;
  headers: string[];
  toRow(item: T): unknown[];
}

export function runExport<T>(exporter: Exporter<T>, items: T[]): string {
  return buildCsv(
    exporter.headers,
    items.map((i) => exporter.toRow(i)),
  );
}
