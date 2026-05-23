import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listExeats() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exeat")
    .select(
      "id, status, reason, departure_at, expected_return_at, student:student_id(id, admission_no, person:person_id(full_name))",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getExeat(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exeat")
    .select(
      "*, student:student_id(id, admission_no, person:person_id(full_name)), collector:collector_guardian_id(id, person:person_id(full_name, phone))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Authorised collectors for a student (for the exeat form's collector picker).
export async function listAuthorisedCollectors(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_guardian")
    .select("guardian:guardian_id(id, person:person_id(full_name, phone))")
    .eq("student_id", studentId)
    .eq("is_authorised_collector", true);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((r) => r.guardian)
    .filter((g): g is NonNullable<typeof g> => Boolean(g));
}
