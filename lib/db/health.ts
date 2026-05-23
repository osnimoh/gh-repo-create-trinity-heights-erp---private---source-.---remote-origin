import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getHealthRecord(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("health_record")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listSickBayVisits(studentId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("sick_bay_visit")
    .select(
      "id, visited_at, complaint, treatment, outcome, student:student_id(id, admission_no, person:person_id(full_name))",
    )
    .order("visited_at", { ascending: false })
    .limit(100);
  if (studentId) query = query.eq("student_id", studentId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// DSL only — RLS guarantees this returns nothing for any other role.
export async function listSafeguardingFlags() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("safeguarding_flag")
    .select(
      "id, category, severity, status, details, created_at, student:student_id(id, admission_no, person:person_id(full_name))",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
