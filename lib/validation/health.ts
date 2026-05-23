import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const healthRecordSchema = z.object({
  student_id: z.string().uuid("Choose a student."),
  blood_group: optionalText,
  allergies: optionalText,
  conditions: optionalText,
  medications: optionalText,
  notes: optionalText,
});

export const sickBayVisitSchema = z.object({
  student_id: z.string().uuid("Choose a student."),
  complaint: optionalText,
  treatment: optionalText,
  outcome: optionalText,
});

export const safeguardingFlagSchema = z.object({
  student_id: z.string().uuid("Choose a student."),
  category: z.string().trim().min(2, "Category is required."),
  severity: z.enum(["low", "medium", "high"]),
  details: optionalText,
  status: z.enum(["open", "monitoring", "closed"]).optional(),
});
