"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_TRANSITIONS } from "@/lib/constants";
import {
  createApplicationSchema,
  examScoreSchema,
  enrolSchema,
  setStatusSchema,
} from "@/lib/validation/admissions";

export type ActionState = { error: string | null };

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function createApplication(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createApplicationSchema.safeParse({
    full_name: formData.get("full_name"),
    date_of_birth: formData.get("date_of_birth"),
    sex: formData.get("sex") || undefined,
    email: formData.get("email"),
    phone: formData.get("phone"),
    stream: formData.get("stream") || undefined,
    track: formData.get("track") || undefined,
    academic_year_id: formData.get("academic_year_id"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const input = parsed.data;
  const supabase = await createClient();
  const createdBy = await currentUserId();

  const { data: person, error: personErr } = await supabase
    .from("person")
    .insert({
      full_name: input.full_name,
      date_of_birth: input.date_of_birth ?? null,
      sex: input.sex ?? null,
      email: input.email ? input.email : null,
      phone: input.phone ?? null,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (personErr || !person) {
    return { error: personErr?.message ?? "Could not create applicant." };
  }

  const { data: application, error: appErr } = await supabase
    .from("application")
    .insert({
      person_id: person.id,
      academic_year_id: input.academic_year_id ? input.academic_year_id : null,
      stream: input.stream ?? null,
      track: input.track ?? null,
      notes: input.notes ?? null,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (appErr || !application) {
    return { error: appErr?.message ?? "Could not create application." };
  }

  revalidatePath("/admissions");
  redirect(`/admissions/${application.id}`);
}

export async function recordExamScore(formData: FormData): Promise<void> {
  const parsed = examScoreSchema.safeParse({
    application_id: formData.get("application_id"),
    exam_score: formData.get("exam_score"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("application")
    .update({ exam_score: parsed.data.exam_score, status: "exam_taken" })
    .eq("id", parsed.data.application_id);

  revalidatePath(`/admissions/${parsed.data.application_id}`);
}

export async function setApplicationStatus(formData: FormData): Promise<void> {
  const parsed = setStatusSchema.safeParse({
    application_id: formData.get("application_id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("application")
    .select("status")
    .eq("id", parsed.data.application_id)
    .maybeSingle();
  if (!current) return;

  // Enrolment goes through the RPC, never a plain status flip.
  const allowed: string[] = APPLICATION_TRANSITIONS[current.status].filter(
    (s) => s !== "enrolled",
  );
  if (!allowed.includes(parsed.data.status)) return;

  const terminal = ["rejected", "withdrawn"].includes(parsed.data.status);
  await supabase
    .from("application")
    .update({
      status: parsed.data.status,
      decided_on: terminal ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", parsed.data.application_id);

  revalidatePath(`/admissions/${parsed.data.application_id}`);
}

export async function enrolApplicant(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = enrolSchema.safeParse({
    application_id: formData.get("application_id"),
    academic_year_id: formData.get("academic_year_id"),
    class_id: formData.get("class_id"),
    house_id: formData.get("house_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid enrolment." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("enrol_applicant", {
    p_application_id: parsed.data.application_id,
    p_academic_year_id: parsed.data.academic_year_id,
    p_class_id: parsed.data.class_id ? parsed.data.class_id : undefined,
    p_house_id: parsed.data.house_id ? parsed.data.house_id : undefined,
  });
  if (error) {
    return { error: error.message };
  }

  const studentId = data?.[0]?.student_id;
  revalidatePath("/admissions");
  revalidatePath("/students");
  if (studentId) redirect(`/students/${studentId}`);
  return { error: null };
}
