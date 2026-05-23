import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

const TONE: Record<ApplicationStatus, string> = {
  submitted: "bg-cream text-navy",
  exam_taken: "bg-cream text-navy",
  offered: "bg-gold/20 text-navy",
  accepted: "bg-gold/20 text-navy",
  enrolled: "bg-maroon text-white",
  rejected: "bg-navy/10 text-muted",
  withdrawn: "bg-navy/10 text-muted",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[status]}`}
    >
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}
