import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/auth/roles";

// All functions here are for admin pages only — call requireAdmin() in the page
// before using them.

export async function listRoleAssignments() {
  const admin = createAdminClient();
  const { data: roles } = await admin
    .from("user_roles")
    .select("id, user_id, role")
    .order("role");
  const { data: users } = await admin.auth.admin.listUsers();
  const emailById = new Map((users?.users ?? []).map((u) => [u.id, u.email]));
  return (roles ?? []).map((r) => ({
    id: r.id,
    role: r.role as AppRole,
    userId: r.user_id,
    email: emailById.get(r.user_id) ?? r.user_id,
  }));
}

export async function listStaffWithNames() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("id, staff_no, person:person_id(full_name)");
  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.person?.full_name ?? s.staff_no ?? "Staff",
  }));
}

export async function listStaffHouse() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_house")
    .select(
      "id, staff:staff_id(person:person_id(full_name)), house:house_id(name)",
    );
  return (data ?? []).map((sh) => ({
    id: sh.id,
    staffName: sh.staff?.person?.full_name ?? "Staff",
    houseName: sh.house?.name ?? "—",
  }));
}

export async function listClassSubjectsDetailed() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_subject")
    .select(
      "id, class:class_id(name), subject:subject_id(name), teacher:teacher_staff_id(person:person_id(full_name))",
    );
  return (data ?? []).map((cs) => ({
    id: cs.id,
    className: cs.class?.name ?? "—",
    subjectName: cs.subject?.name ?? "—",
    teacherName: cs.teacher?.person?.full_name ?? "Unassigned",
  }));
}
