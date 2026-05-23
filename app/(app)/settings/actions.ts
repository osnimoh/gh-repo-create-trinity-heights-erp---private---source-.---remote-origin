"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/session";
import { APP_ROLES } from "@/lib/auth/roles";

export type ActionState = { error: string | null; ok?: boolean };

const assignRoleSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  role: z.enum(APP_ROLES),
});

export async function assignRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = assignRoleSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const admin = createAdminClient();
  const { data: users, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) return { error: listErr.message };
  const user = users.users.find(
    (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase(),
  );
  if (!user) {
    return {
      error: "No account with that email. The user must sign up first.",
    };
  }

  const { error } = await admin
    .from("user_roles")
    .upsert(
      { user_id: user.id, role: parsed.data.role },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
  if (error) return { error: error.message };

  revalidatePath("/settings/roles");
  return { error: null, ok: true };
}

export async function removeRole(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("user_roles").delete().eq("id", id);
  revalidatePath("/settings/roles");
}

const assignHouseStaffSchema = z.object({
  staff_id: z.string().uuid("Choose a staff member."),
  house_id: z.string().uuid("Choose a house."),
});

export async function assignHouseStaff(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = assignHouseStaffSchema.safeParse({
    staff_id: formData.get("staff_id"),
    house_id: formData.get("house_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("staff_house").upsert(parsed.data, {
    onConflict: "staff_id,house_id",
    ignoreDuplicates: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/settings/house-staff");
  return { error: null, ok: true };
}

export async function removeHouseStaff(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("staff_house").delete().eq("id", id);
  revalidatePath("/settings/house-staff");
}

const classSubjectSchema = z.object({
  class_id: z.string().uuid("Choose a class."),
  subject_id: z.string().uuid("Choose a subject."),
  teacher_staff_id: z.string().uuid().optional().or(z.literal("")),
});

export async function createClassSubject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = classSubjectSchema.safeParse({
    class_id: formData.get("class_id"),
    subject_id: formData.get("subject_id"),
    teacher_staff_id: formData.get("teacher_staff_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("class_subject").upsert(
    {
      class_id: parsed.data.class_id,
      subject_id: parsed.data.subject_id,
      teacher_staff_id: parsed.data.teacher_staff_id
        ? parsed.data.teacher_staff_id
        : null,
    },
    { onConflict: "class_id,subject_id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/settings/subjects");
  return { error: null, ok: true };
}

export async function removeClassSubject(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("class_subject").delete().eq("id", id);
  revalidatePath("/settings/subjects");
}
