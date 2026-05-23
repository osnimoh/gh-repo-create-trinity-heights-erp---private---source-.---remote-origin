import { z } from "zod";

export const composeMessageSchema = z.object({
  subject: z.string().trim().min(2, "Subject is required."),
  body: z.string().trim().min(1, "Message body is required."),
  audience: z.enum(["all_parents", "all_staff", "class", "individual"]),
  class_id: z.string().uuid().optional().or(z.literal("")),
  target_user_id: z.string().uuid().optional().or(z.literal("")),
  send_email: z.coerce.boolean().optional(),
  send_sms: z.coerce.boolean().optional(),
});

export const acknowledgeSchema = z.object({
  message_id: z.string().uuid(),
});
