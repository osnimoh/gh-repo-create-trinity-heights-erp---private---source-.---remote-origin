"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  healthRecordSchema,
  safeguardingFlagSchema,
  sickBayVisitSchema,
} from "@/lib/validation/health";

export type ActionState = { error: string | null };

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function saveHealthRecord(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = healthRecordSchema.safeParse({
    student_id: formData.get("student_id"),
    blood_group: formData.get("blood_group"),
    allergies: formData.get("allergies"),
    conditions: formData.get("conditions"),
    medications: formData.get("medications"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid record." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("health_record").upsert(
    {
      student_id: parsed.data.student_id,
      blood_group: parsed.data.blood_group ?? null,
      allergies: parsed.data.allergies ?? null,
      conditions: parsed.data.conditions ?? null,
      medications: parsed.data.medications ?? null,
      notes: parsed.data.notes ?? null,
      created_by: await currentUserId(),
    },
    { onConflict: "student_id" },
  );
  if (error) return { error: error.message };
  revalidatePath(`/health?student_id=${parsed.data.student_id}`);
  return { error: null };
}

export async function addSickBayVisit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = sickBayVisitSchema.safeParse({
    student_id: formData.get("student_id"),
    complaint: formData.get("complaint"),
    treatment: formData.get("treatment"),
    outcome: formData.get("outcome"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid visit." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("sick_bay_visit").insert({
    student_id: parsed.data.student_id,
    complaint: parsed.data.complaint ?? null,
    treatment: parsed.data.treatment ?? null,
    outcome: parsed.data.outcome ?? null,
    created_by: await currentUserId(),
  });
  if (error) return { error: error.message };
  revalidatePath(`/health?student_id=${parsed.data.student_id}`);
  return { error: null };
}

export async function createSafeguardingFlag(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = safeguardingFlagSchema.safeParse({
    student_id: formData.get("student_id"),
    category: formData.get("category"),
    severity: formData.get("severity"),
    details: formData.get("details"),
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid flag." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("safeguarding_flag").insert({
    student_id: parsed.data.student_id,
    category: parsed.data.category,
    severity: parsed.data.severity,
    details: parsed.data.details ?? null,
    status: parsed.data.status ?? "open",
    raised_by: await currentUserId(),
    created_by: await currentUserId(),
  });
  if (error) return { error: error.message };
  revalidatePath("/health/safeguarding");
  return { error: null };
}
