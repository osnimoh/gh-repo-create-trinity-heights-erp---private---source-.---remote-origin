import { z } from "zod";

export const createAssessmentSchema = z.object({
  class_subject_id: z.string().uuid("Choose a class subject."),
  term_id: z.string().uuid("Choose a term."),
  name: z.string().trim().min(2, "Give the assessment a name."),
  max_score: z.coerce.number().positive("Max score must be greater than zero."),
  weight: z.coerce.number().min(0, "Weight cannot be negative."),
  assessment_date: z.string().optional().or(z.literal("")),
});

export const resultMarkSchema = z.object({
  student_id: z.string().uuid(),
  score: z.coerce.number().min(0),
});

export const saveResultsMetaSchema = z.object({
  assessment_id: z.string().uuid(),
});

export const generateReportCardSchema = z.object({
  student_id: z.string().uuid("Choose a student."),
  term_id: z.string().uuid("Choose a term."),
});

export const timetableEntrySchema = z.object({
  class_id: z.string().uuid("Choose a class."),
  day_of_week: z.coerce.number().int().min(1).max(7),
  period_no: z.coerce.number().int().min(1),
  subject_id: z.string().uuid().optional().or(z.literal("")),
  room: z.string().trim().optional(),
});
