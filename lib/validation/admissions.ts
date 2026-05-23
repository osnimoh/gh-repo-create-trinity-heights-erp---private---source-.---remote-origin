import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

// Create an applicant (person) + application in one form.
export const createApplicationSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required."),
  date_of_birth: optionalText,
  sex: z.enum(["male", "female"]).optional(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .optional()
    .or(z.literal("")),
  phone: optionalText,
  stream: z.enum(["science", "general_arts", "business"]).optional(),
  track: z.enum(["wassce", "wassce_igcse"]).optional(),
  academic_year_id: z.string().uuid().optional().or(z.literal("")),
  notes: optionalText,
});
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const examScoreSchema = z.object({
  application_id: z.string().uuid(),
  exam_score: z.coerce
    .number()
    .min(0, "Score cannot be negative.")
    .max(100, "Score cannot exceed 100."),
});

export const enrolSchema = z.object({
  application_id: z.string().uuid(),
  academic_year_id: z.string().uuid("Choose the academic year."),
  class_id: z.string().uuid().optional().or(z.literal("")),
  house_id: z.string().uuid().optional().or(z.literal("")),
});

export const APPLICATION_STATUS_VALUES = [
  "submitted",
  "exam_taken",
  "offered",
  "accepted",
  "enrolled",
  "rejected",
  "withdrawn",
] as const;

export const setStatusSchema = z.object({
  application_id: z.string().uuid(),
  status: z.enum(APPLICATION_STATUS_VALUES),
});
