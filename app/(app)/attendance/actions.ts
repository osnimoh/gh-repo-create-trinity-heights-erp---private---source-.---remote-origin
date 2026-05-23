"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EXEAT_TRANSITIONS } from "@/lib/constants";
import {
  attendanceMetaSchema,
  boardingMetaSchema,
  exeatCreateSchema,
  exeatStatusSchema,
  markSchema,
} from "@/lib/validation/attendance";

export type ActionState = { error: string | null };

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function saveAttendance(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const meta = attendanceMetaSchema.safeParse({
    class_id: formData.get("class_id"),
    session_date: formData.get("session_date"),
    session_type: formData.get("session_type"),
  });
  if (!meta.success) return { error: "Invalid attendance details." };

  let studentIds: string[];
  try {
    studentIds = JSON.parse(String(formData.get("student_ids") ?? "[]"));
  } catch {
    return { error: "Could not read the roster." };
  }

  const marks = [];
  for (const id of studentIds) {
    const status = formData.get(`status_${id}`);
    const parsed = markSchema.safeParse({ student_id: id, status });
    if (parsed.success) marks.push(parsed.data);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_attendance", {
    p_class_id: meta.data.class_id,
    p_session_date: meta.data.session_date,
    p_session_type: meta.data.session_type,
    p_marks: marks,
  });
  if (error) return { error: error.message };

  revalidatePath("/attendance");
  return { error: null };
}

export async function saveBoardingRoll(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const meta = boardingMetaSchema.safeParse({
    house_id: formData.get("house_id"),
    roll_date: formData.get("roll_date"),
    session: formData.get("session"),
  });
  if (!meta.success) return { error: "Invalid roll details." };

  let studentIds: string[];
  try {
    studentIds = JSON.parse(String(formData.get("student_ids") ?? "[]"));
  } catch {
    return { error: "Could not read the roster." };
  }

  const createdBy = await currentUserId();
  const rows = studentIds.map((id) => ({
    student_id: id,
    house_id: meta.data.house_id,
    roll_date: meta.data.roll_date,
    session: meta.data.session,
    present: formData.get(`present_${id}`) === "on",
    created_by: createdBy,
  }));

  const supabase = await createClient();
  const { error } = await supabase
    .from("boarding_roll")
    .upsert(rows, { onConflict: "student_id,roll_date,session" });
  if (error) return { error: error.message };

  revalidatePath("/attendance/boarding");
  return { error: null };
}

export async function createExeat(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = exeatCreateSchema.safeParse({
    student_id: formData.get("student_id"),
    collector_guardian_id: formData.get("collector_guardian_id"),
    reason: formData.get("reason"),
    departure_at: formData.get("departure_at"),
    expected_return_at: formData.get("expected_return_at"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid exeat." };
  }
  const input = parsed.data;
  const supabase = await createClient();
  const createdBy = await currentUserId();

  const { data, error } = await supabase
    .from("exeat")
    .insert({
      student_id: input.student_id,
      collector_guardian_id: input.collector_guardian_id
        ? input.collector_guardian_id
        : null,
      reason: input.reason ?? null,
      departure_at: input.departure_at ? input.departure_at : null,
      expected_return_at: input.expected_return_at
        ? input.expected_return_at
        : null,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/attendance/exeat");
  redirect(`/attendance/exeat/${data!.id}`);
}

export async function setExeatStatus(formData: FormData): Promise<void> {
  const parsed = exeatStatusSchema.safeParse({
    exeat_id: formData.get("exeat_id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("exeat")
    .select("status")
    .eq("id", parsed.data.exeat_id)
    .maybeSingle();
  if (!current) return;

  const allowed: string[] = EXEAT_TRANSITIONS[current.status];
  if (!allowed.includes(parsed.data.status)) return;

  await supabase
    .from("exeat")
    .update({
      status: parsed.data.status,
      actual_return_at:
        parsed.data.status === "returned" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.exeat_id);

  revalidatePath(`/attendance/exeat/${parsed.data.exeat_id}`);
}
