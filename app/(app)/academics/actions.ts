"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createAssessmentSchema,
  generateReportCardSchema,
  resultMarkSchema,
  saveResultsMetaSchema,
  timetableEntrySchema,
} from "@/lib/validation/academics";

export type ActionState = { error: string | null };

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function createAssessment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createAssessmentSchema.safeParse({
    class_subject_id: formData.get("class_subject_id"),
    term_id: formData.get("term_id"),
    name: formData.get("name"),
    max_score: formData.get("max_score"),
    weight: formData.get("weight"),
    assessment_date: formData.get("assessment_date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid assessment." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("assessment").insert({
    class_subject_id: parsed.data.class_subject_id,
    term_id: parsed.data.term_id,
    name: parsed.data.name,
    max_score: parsed.data.max_score,
    weight: parsed.data.weight,
    assessment_date: parsed.data.assessment_date
      ? parsed.data.assessment_date
      : null,
    created_by: await currentUserId(),
  });
  if (error) return { error: error.message };

  revalidatePath("/academics");
  return { error: null };
}

export async function saveResults(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const meta = saveResultsMetaSchema.safeParse({
    assessment_id: formData.get("assessment_id"),
  });
  if (!meta.success) return { error: "Invalid assessment." };

  let studentIds: string[];
  try {
    studentIds = JSON.parse(String(formData.get("student_ids") ?? "[]"));
  } catch {
    return { error: "Could not read the roster." };
  }

  const marks = [];
  for (const id of studentIds) {
    const raw = formData.get(`score_${id}`);
    if (raw === null || raw === "") continue; // skip blanks
    const parsed = resultMarkSchema.safeParse({ student_id: id, score: raw });
    if (parsed.success) marks.push(parsed.data);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_results", {
    p_assessment_id: meta.data.assessment_id,
    p_marks: marks,
  });
  if (error) return { error: error.message };

  revalidatePath(`/academics?assessment_id=${meta.data.assessment_id}`);
  return { error: null };
}

export async function generateReportCard(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = generateReportCardSchema.safeParse({
    student_id: formData.get("student_id"),
    term_id: formData.get("term_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid selection." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("generate_report_card", {
    p_student_id: parsed.data.student_id,
    p_term_id: parsed.data.term_id,
  });
  if (error) return { error: error.message };

  redirect(
    `/academics/report-cards?student_id=${parsed.data.student_id}&term_id=${parsed.data.term_id}`,
  );
}

export async function addTimetableEntry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = timetableEntrySchema.safeParse({
    class_id: formData.get("class_id"),
    day_of_week: formData.get("day_of_week"),
    period_no: formData.get("period_no"),
    subject_id: formData.get("subject_id"),
    room: formData.get("room"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid entry." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("timetable").upsert(
    {
      class_id: parsed.data.class_id,
      day_of_week: parsed.data.day_of_week,
      period_no: parsed.data.period_no,
      subject_id: parsed.data.subject_id ? parsed.data.subject_id : null,
      room: parsed.data.room ?? null,
    },
    { onConflict: "class_id,day_of_week,period_no" },
  );
  if (error) return { error: error.message };

  revalidatePath(`/academics/timetable?class_id=${parsed.data.class_id}`);
  return { error: null };
}
