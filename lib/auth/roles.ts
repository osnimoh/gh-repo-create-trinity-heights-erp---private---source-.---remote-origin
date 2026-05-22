// The role set is the single source of truth for the app side; the database
// enforces it via RLS (see /supabase/policies). UI checks are convenience only
// and are NEVER the access control.

export const APP_ROLES = [
  "admin", // leadership; broad access
  "teacher", // own classes only; no fees, no health
  "form_teacher", // own class pastoral
  "house_staff", // own house pastoral
  "bursary", // fees only; basic identity
  "nurse", // health + sick bay only
  "dsl", // safeguarding ONLY (+ pastoral context)
  "admissions", // applications / enrolment
  "parent", // their own children only — nothing about others
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  form_teacher: "Form Teacher",
  house_staff: "House Staff",
  bursary: "Bursary",
  nurse: "Nurse",
  dsl: "Safeguarding Lead",
  admissions: "Admissions",
  parent: "Parent",
};

export function roleLabel(role: AppRole): string {
  return ROLE_LABELS[role];
}
