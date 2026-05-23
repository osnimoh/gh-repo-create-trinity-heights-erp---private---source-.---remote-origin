import type { Database } from "@/lib/supabase/database.types";

type Stream = Database["public"]["Enums"]["stream"];
type Track = Database["public"]["Enums"]["track"];
type YearGroup = Database["public"]["Enums"]["year_group"];
type Sex = Database["public"]["Enums"]["sex"];
type ApplicationStatus = Database["public"]["Enums"]["application_status"];

export const STREAMS: { value: Stream; label: string }[] = [
  { value: "science", label: "Science" },
  { value: "general_arts", label: "General Arts" },
  { value: "business", label: "Business" },
];

export const TRACKS: { value: Track; label: string }[] = [
  { value: "wassce", label: "WASSCE" },
  { value: "wassce_igcse", label: "WASSCE + IGCSE" },
];

export const YEAR_GROUPS: { value: YearGroup; label: string }[] = [
  { value: "shs1", label: "SHS 1" },
  { value: "shs2", label: "SHS 2" },
  { value: "shs3", label: "SHS 3" },
];

export const SEXES: { value: Sex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  exam_taken: "Exam taken",
  offered: "Offered",
  accepted: "Accepted",
  enrolled: "Enrolled",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

// Allowed forward transitions for the one-gate pipeline (plus reject/withdraw).
export const APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  submitted: ["exam_taken", "rejected", "withdrawn"],
  exam_taken: ["offered", "rejected", "withdrawn"],
  offered: ["accepted", "rejected", "withdrawn"],
  accepted: ["enrolled", "withdrawn"],
  enrolled: [],
  rejected: [],
  withdrawn: [],
};

function lookup<T extends string>(
  list: { value: T; label: string }[],
  value: T | null,
): string {
  if (value === null) return "—";
  return list.find((o) => o.value === value)?.label ?? value;
}

export const streamLabel = (v: Stream | null) => lookup(STREAMS, v);
export const trackLabel = (v: Track | null) => lookup(TRACKS, v);
export const yearGroupLabel = (v: YearGroup | null) => lookup(YEAR_GROUPS, v);
