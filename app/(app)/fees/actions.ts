"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  feeStructureSchema,
  generateInvoiceSchema,
  recordPaymentSchema,
  scholarshipSchema,
} from "@/lib/validation/fees";

export type ActionState = { error: string | null };

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function generateInvoice(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = generateInvoiceSchema.safeParse({
    student_id: formData.get("student_id"),
    term_id: formData.get("term_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_invoice", {
    p_student_id: parsed.data.student_id,
    p_term_id: parsed.data.term_id,
  });
  if (error) return { error: error.message };

  revalidatePath("/fees");
  if (data) redirect(`/fees/${data}`);
  return { error: null };
}

export async function recordPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = recordPaymentSchema.safeParse({
    invoice_id: formData.get("invoice_id"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    reference: formData.get("reference"),
    paid_on: formData.get("paid_on"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid payment." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_payment", {
    p_invoice_id: parsed.data.invoice_id,
    p_amount: parsed.data.amount,
    p_method: parsed.data.method,
    p_reference: parsed.data.reference ? parsed.data.reference : undefined,
    p_paid_on: parsed.data.paid_on ? parsed.data.paid_on : undefined,
  });
  if (error) return { error: error.message };

  revalidatePath(`/fees/${parsed.data.invoice_id}`);
  return { error: null };
}

export async function createScholarship(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = scholarshipSchema.safeParse({
    student_id: formData.get("student_id"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    value: formData.get("value"),
    academic_year_id: formData.get("academic_year_id"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid scholarship." };
  }

  const supabase = await createClient();
  const createdBy = await currentUserId();
  const { error } = await supabase.from("scholarship").insert({
    student_id: parsed.data.student_id,
    name: parsed.data.name,
    kind: parsed.data.kind,
    value: parsed.data.value,
    academic_year_id: parsed.data.academic_year_id
      ? parsed.data.academic_year_id
      : null,
    created_by: createdBy,
  });
  if (error) return { error: error.message };

  revalidatePath("/fees/scholarships");
  return { error: null };
}

export async function upsertFeeStructure(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = feeStructureSchema.safeParse({
    academic_year_id: formData.get("academic_year_id"),
    year_group: formData.get("year_group"),
    amount: formData.get("amount"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid fee." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fee_structure").upsert(
    {
      academic_year_id: parsed.data.academic_year_id,
      year_group: parsed.data.year_group,
      amount: parsed.data.amount,
      description: parsed.data.description ?? null,
    },
    { onConflict: "academic_year_id,year_group" },
  );
  if (error) return { error: error.message };

  revalidatePath("/fees/structures");
  return { error: null };
}
