import { z } from "zod";

export const generateInvoiceSchema = z.object({
  student_id: z.string().uuid("Choose a student."),
  term_id: z.string().uuid("Choose a term."),
});

export const recordPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  method: z.enum(["momo", "bank", "cash"]),
  reference: z.string().trim().optional(),
  paid_on: z.string().optional().or(z.literal("")),
});

export const scholarshipSchema = z.object({
  student_id: z.string().uuid("Choose a student."),
  name: z.string().trim().min(2, "Give the scholarship a name."),
  kind: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().min(0, "Value cannot be negative."),
  academic_year_id: z.string().uuid().optional().or(z.literal("")),
});

export const feeStructureSchema = z.object({
  academic_year_id: z.string().uuid("Choose the academic year."),
  year_group: z.enum(["shs1", "shs2", "shs3"]),
  amount: z.coerce.number().min(0, "Amount cannot be negative."),
  description: z.string().trim().optional(),
});
