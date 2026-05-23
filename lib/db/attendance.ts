import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SessionType = Database["public"]["Enums"]["attendance_session_type"];

export type RosterEntry = {
  studentId: string;
  fullName: string;
  admissionNo: string | null;
};

// Students placed in a class for the current academic year (active enrolments).
export async function getClassRoster(classId: string): Promise<RosterEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrolment")
    .select("student:student_id(id, admission_no, person:person_id(full_name))")
    .eq("class_id", classId)
    .eq("status", "active");
  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => row.student)
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({
      studentId: s.id,
      fullName: s.person?.full_name ?? "—",
      admissionNo: s.admission_no,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

// Existing marks for a session, as a { studentId: status } map for prefill.
export async function getExistingMarks(
  classId: string,
  date: string,
  sessionType: SessionType,
): Promise<Record<string, Database["public"]["Enums"]["attendance_status"]>> {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("attendance_session")
    .select("id")
    .eq("class_id", classId)
    .eq("session_date", date)
    .eq("session_type", sessionType)
    .maybeSingle();
  if (!session) return {};

  const { data: marks } = await supabase
    .from("attendance_mark")
    .select("student_id, status")
    .eq("attendance_session_id", session.id);

  const out: Record<string, Database["public"]["Enums"]["attendance_status"]> =
    {};
  for (const m of marks ?? []) out[m.student_id] = m.status;
  return out;
}

// Recent sessions with absent/late counts for the summary view.
export async function listRecentSessions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_session")
    .select(
      "id, session_date, session_type, class:class_id(name), marks:attendance_mark(status)",
    )
    .order("session_date", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);

  return (data ?? []).map((s) => {
    const marks = s.marks ?? [];
    const absent = marks.filter((m) => m.status === "absent").length;
    const late = marks.filter((m) => m.status === "late").length;
    return {
      id: s.id,
      sessionDate: s.session_date,
      sessionType: s.session_type,
      className: s.class?.name ?? "—",
      total: marks.length,
      absent,
      late,
    };
  });
}
