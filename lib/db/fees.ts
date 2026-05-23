import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getFeesSummary() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice")
    .select("net_amount, amount_paid, status");
  if (error) throw new Error(error.message);

  let billed = 0;
  let collected = 0;
  for (const inv of data ?? []) {
    billed += Number(inv.net_amount);
    collected += Number(inv.amount_paid);
  }
  return {
    billed,
    collected,
    outstanding: billed - collected,
    count: (data ?? []).length,
  };
}

export async function listInvoices() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoice")
    .select(
      "id, net_amount, amount_paid, status, student:student_id(id, admission_no, person:person_id(full_name)), term:term_id(name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getInvoice(id: string) {
  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoice")
    .select(
      "*, student:student_id(id, admission_no, person:person_id(full_name)), term:term_id(name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!invoice) return null;

  const { data: payments } = await supabase
    .from("payment")
    .select("id, amount, method, reference, paid_on")
    .eq("invoice_id", id)
    .order("paid_on", { ascending: false });

  return { invoice, payments: payments ?? [] };
}

export async function listScholarships(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scholarship")
    .select("id, name, kind, value, active")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listTerms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("term")
    .select("id, name, number, academic_year:academic_year_id(name)")
    .order("number");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listFeeStructures() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fee_structure")
    .select("id, year_group, amount, academic_year:academic_year_id(name)")
    .order("year_group");
  if (error) throw new Error(error.message);
  return data ?? [];
}
