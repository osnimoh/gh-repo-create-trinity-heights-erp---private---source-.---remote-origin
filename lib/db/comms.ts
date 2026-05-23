import "server-only";
import { createClient } from "@/lib/supabase/server";

// Messages visible to the current user (RLS filters by audience).
export async function listMessages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message")
    .select("id, subject, body, audience, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// The set of message_ids the current user has acknowledged.
export async function myAcknowledgedIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("acknowledgement").select("message_id");
  return new Set((data ?? []).map((a) => a.message_id));
}
