import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listClassSubjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_subject")
    .select("id, class:class_id(name), subject:subject_id(name)")
    .order("id");
  if (error) throw new Error(error.message);
  return (data ?? []).map((cs) => ({
    id: cs.id,
    label: `${cs.class?.name ?? "?"} · ${cs.subject?.name ?? "?"}`,
  }));
}

export async function listAssessments(classSubjectId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("assessment")
    .select(
      "id, name, max_score, weight, assessment_date, term:term_id(name), class_subject:class_subject_id(class:class_id(name), subject:subject_id(name))",
    )
    .order("assessment_date", { ascending: false, nullsFirst: false });
  if (classSubjectId) query = query.eq("class_subject_id", classSubjectId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type ResultRosterEntry = {
  studentId: string;
  fullName: string;
  admissionNo: string | null;
  score: number | null;
};

// Students in the assessment's class + their existing scores for prefill.
export async function getResultRoster(
  assessmentId: string,
): Promise<{ maxScore: number; roster: ResultRosterEntry[] } | null> {
  const supabase = await createClient();

  const { data: assessment } = await supabase
    .from("assessment")
    .select("max_score, class_subject:class_subject_id(class_id)")
    .eq("id", assessmentId)
    .maybeSingle();
  if (!assessment) return null;
  const classId = assessment.class_subject?.class_id;
  if (!classId) return { maxScore: Number(assessment.max_score), roster: [] };

  const { data: enrolments } = await supabase
    .from("enrolment")
    .select("student:student_id(id, admission_no, person:person_id(full_name))")
    .eq("class_id", classId)
    .eq("status", "active");

  const { data: results } = await supabase
    .from("result")
    .select("student_id, score")
    .eq("assessment_id", assessmentId);
  const scoreByStudent = new Map(
    (results ?? []).map((r) => [r.student_id, Number(r.score)]),
  );

  const roster = (enrolments ?? [])
    .map((e) => e.student)
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({
      studentId: s.id,
      fullName: s.person?.full_name ?? "—",
      admissionNo: s.admission_no,
      score: scoreByStudent.get(s.id) ?? null,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return { maxScore: Number(assessment.max_score), roster };
}

export async function getReportCard(studentId: string, termId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_card")
    .select(
      "*, student:student_id(admission_no, person:person_id(full_name)), term:term_id(name)",
    )
    .eq("student_id", studentId)
    .eq("term_id", termId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getTimetable(classId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timetable")
    .select("id, day_of_week, period_no, room, subject:subject_id(name)")
    .eq("class_id", classId)
    .order("day_of_week")
    .order("period_no");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listSubjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subject")
    .select("id, name")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}
