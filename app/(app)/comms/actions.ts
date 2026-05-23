"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getGateway } from "@/lib/comms/gateway";
import {
  acknowledgeSchema,
  composeMessageSchema,
} from "@/lib/validation/comms";

export type ActionState = { error: string | null };

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function composeMessage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = composeMessageSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    audience: formData.get("audience"),
    class_id: formData.get("class_id"),
    target_user_id: formData.get("target_user_id"),
    send_email: formData.get("send_email") === "on",
    send_sms: formData.get("send_sms") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid message." };
  }
  const input = parsed.data;
  const supabase = await createClient();
  const uid = await currentUserId();

  const { data: message, error } = await supabase
    .from("message")
    .insert({
      subject: input.subject,
      body: input.body,
      audience: input.audience,
      class_id: input.class_id ? input.class_id : null,
      target_user_id: input.target_user_id ? input.target_user_id : null,
      send_email: Boolean(input.send_email),
      send_sms: Boolean(input.send_sms),
      sender_user_id: uid,
      created_by: uid,
    })
    .select("id")
    .single();
  if (error || !message) {
    return { error: error?.message ?? "Could not send message." };
  }

  // Direct (individual) messages dispatch via the stubbed gateway and record a
  // notification. Broadcast audiences are delivered in-app via RLS.
  if (input.audience === "individual" && input.target_user_id) {
    const gateway = getGateway();
    if (input.send_email)
      await gateway.sendEmail("parent", input.subject, input.body);
    if (input.send_sms) await gateway.sendSms("parent", input.body);
    await supabase.from("notification").insert({
      message_id: message.id,
      user_id: input.target_user_id,
      channel: input.send_sms ? "sms" : input.send_email ? "email" : "in_app",
      status: "sent",
    });
  }

  revalidatePath("/comms");
  return { error: null };
}

export async function acknowledgeMessage(formData: FormData): Promise<void> {
  const parsed = acknowledgeSchema.safeParse({
    message_id: formData.get("message_id"),
  });
  if (!parsed.success) return;
  const supabase = await createClient();
  const uid = await currentUserId();
  if (!uid) return;
  await supabase
    .from("acknowledgement")
    .insert({ message_id: parsed.data.message_id, user_id: uid });
  revalidatePath("/comms");
}
