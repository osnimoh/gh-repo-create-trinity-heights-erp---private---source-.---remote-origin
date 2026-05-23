import type { Exporter } from "./types";

// Common shape the app already has; exporters map it to (unconfirmed) layouts.
export type ExportStudent = {
  admission_no: string | null;
  full_name: string;
  date_of_birth: string | null;
  sex: string | null;
  year_group: string | null;
  stream: string | null;
};

// EMIS / Annual School Census (Ministry of Education / SRIM).
// [CONFIRM] real field list + codes before any submission.
export const emisExporter: Exporter<ExportStudent> = {
  key: "emis",
  label: "EMIS / Annual School Census",
  status: "scaffold",
  confirmSource:
    "Ministry of Education / SRIM Annual Census template [CONFIRM]",
  headers: [
    "admission_no",
    "full_name",
    "date_of_birth",
    "sex",
    "year_group",
    "programme", // [CONFIRM] mapping from stream → EMIS programme code
  ],
  toRow: (s) => [
    s.admission_no ?? "",
    s.full_name,
    s.date_of_birth ?? "",
    s.sex ?? "",
    s.year_group ?? "",
    s.stream ?? "", // [CONFIRM]
  ],
};

// WAEC candidate registration (WASSCE).
// [CONFIRM] real candidate record format before any submission.
export const waecExporter: Exporter<ExportStudent> = {
  key: "waec",
  label: "WAEC candidate register",
  status: "scaffold",
  confirmSource: "WAEC candidate registration spec [CONFIRM]",
  headers: [
    "index_number", // [CONFIRM] WAEC index, not admission_no
    "candidate_name",
    "date_of_birth",
    "sex",
    "subjects", // [CONFIRM] subject codes
  ],
  toRow: (s) => [
    s.admission_no ?? "", // [CONFIRM] placeholder until WAEC index assigned
    s.full_name,
    s.date_of_birth ?? "",
    s.sex ?? "",
    "", // [CONFIRM]
  ],
};

export const EXPORTERS = [emisExporter, waecExporter];

export { runExport } from "./types";
export type { Exporter, ExporterStatus } from "./types";
