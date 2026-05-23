import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type BoardingSession = Database["public"]["Enums"]["boarding_session"];

export type BoardingRosterEntry = {
  studentId: string;
  fullName: string;
  admissionNo: string | null;
  present: boolean;
};

// Boarding students assigned to a house (active enrolments with that house),
// merged with any roll already taken for the given date/session.
export async function getHouseRoster(
  houseId: string,
  date: string,
  session: BoardingSession,
): Promise<BoardingRosterEntry[]> {
  const supabase = await createClient();

  const { data: enrolments, error } = await supabase
    .from("enrolment")
    .select("student:student_id(id, admission_no, person:person_id(full_name))")
    .eq("house_id", houseId)
    .eq("status", "active");
  if (error) throw new Error(error.message);

  const { data: rolls } = await supabase
    .from("boarding_roll")
    .select("student_id, present")
    .eq("house_id", houseId)
    .eq("roll_date", date)
    .eq("session", session);
  const present = new Map((rolls ?? []).map((r) => [r.student_id, r.present]));

  return (enrolments ?? [])
    .map((row) => row.student)
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({
      studentId: s.id,
      fullName: s.person?.full_name ?? "—",
      admissionNo: s.admission_no,
      present: present.get(s.id) ?? true,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}
