import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

export async function listApplications(status?: ApplicationStatus) {
  const supabase = await createClient();
  let query = supabase
    .from("application")
    .select(
      "id, status, stream, track, exam_score, submitted_on, decided_on, person:person_id(id, full_name, preferred_name)",
    )
    .order("submitted_on", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getApplication(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application")
    .select(
      "*, person:person_id(id, full_name, preferred_name, date_of_birth, sex, email, phone)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listAcademicYears() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_year")
    .select("id, name, is_current")
    .order("name", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listHouses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("house")
    .select("id, name")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listClasses(academicYearId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("class")
    .select("id, name, year_group, stream, academic_year_id")
    .order("name");
  if (academicYearId) query = query.eq("academic_year_id", academicYearId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
