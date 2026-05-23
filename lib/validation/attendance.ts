import { z } from "zod";

export const attendanceMetaSchema = z.object({
  class_id: z.string().uuid(),
  session_date: z.string().min(1),
  session_type: z.enum(["morning", "afternoon", "prep"]),
});

export const markSchema = z.object({
  student_id: z.string().uuid(),
  status: z.enum(["present", "absent", "late", "excused"]),
});

export const boardingMetaSchema = z.object({
  house_id: z.string().uuid(),
  roll_date: z.string().min(1),
  session: z.enum(["morning", "evening"]),
});

export const exeatCreateSchema = z.object({
  student_id: z.string().uuid("Choose a student."),
  collector_guardian_id: z.string().uuid().optional().or(z.literal("")),
  reason: z.string().trim().optional(),
  departure_at: z.string().optional().or(z.literal("")),
  expected_return_at: z.string().optional().or(z.literal("")),
});

export const exeatStatusSchema = z.object({
  exeat_id: z.string().uuid(),
  status: z.enum([
    "requested",
    "approved",
    "denied",
    "departed",
    "returned",
    "cancelled",
  ]),
});
