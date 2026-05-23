import "server-only";
import { createClient } from "@/lib/supabase/server";

// A parent's own children (RLS scopes `student` to their children only).
export async function getMyChildren() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student")
    .select(
      "id, admission_no, status, year_group, stream, person:person_id(full_name)",
    )
    .order("admission_no");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Per-child summaries — all RLS-scoped to the parent's own child.
export async function getChildSummary(studentId: string) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("student")
    .select("id, admission_no, year_group, stream, person:person_id(full_name)")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return null;

  const { data: invoices } = await supabase
    .from("invoice")
    .select("id, net_amount, amount_paid, status, term:term_id(name)")
    .eq("student_id", studentId);

  const { data: reportCards } = await supabase
    .from("report_card")
    .select("id, term_id, overall_average, overall_grade, term:term_id(name)")
    .eq("student_id", studentId)
    .order("generated_at", { ascending: false });

  const { data: attendance } = await supabase
    .from("attendance_mark")
    .select("status")
    .eq("student_id", studentId);

  const present = (attendance ?? []).filter(
    (a) => a.status === "present",
  ).length;
  const total = (attendance ?? []).length;

  return {
    student,
    invoices: invoices ?? [],
    reportCards: reportCards ?? [],
    attendance: { present, total },
  };
}
