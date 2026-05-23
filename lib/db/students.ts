import "server-only";
import { createClient } from "@/lib/supabase/server";

// Search by name or admission number. At ~600 students we fetch and filter in
// memory; revisit with server-side full-text search if the roll grows.
export async function searchStudents(q?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student")
    .select(
      "id, admission_no, status, stream, year_group, person:person_id(id, full_name, preferred_name)",
    )
    .order("admission_no", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const needle = q?.trim().toLowerCase();
  if (!needle) return rows;

  return rows.filter((s) => {
    const name = s.person?.full_name?.toLowerCase() ?? "";
    const admission = s.admission_no?.toLowerCase() ?? "";
    return name.includes(needle) || admission.includes(needle);
  });
}

export async function getStudentProfile(id: string) {
  const supabase = await createClient();

  const { data: student, error } = await supabase
    .from("student")
    .select(
      "*, person:person_id(id, full_name, preferred_name, date_of_birth, sex, email, phone)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!student) return null;

  const { data: guardians } = await supabase
    .from("student_guardian")
    .select(
      "id, relationship, is_primary, is_authorised_collector, can_top_up_wallet, guardian:guardian_id(id, occupation, person:person_id(full_name, email, phone))",
    )
    .eq("student_id", id);

  const { data: enrolments } = await supabase
    .from("enrolment")
    .select(
      "id, enrolled_on, status, academic_year:academic_year_id(name), class:class_id(name), house:house_id(name)",
    )
    .eq("student_id", id)
    .order("enrolled_on", { ascending: false });

  return { student, guardians: guardians ?? [], enrolments: enrolments ?? [] };
}
