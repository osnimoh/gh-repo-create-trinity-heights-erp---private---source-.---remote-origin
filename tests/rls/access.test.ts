import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  anonClient,
  createTestUser,
  deleteTestUser,
  rlsEnvReady,
  serviceClient,
  signInAs,
  type TestUser,
} from "./helpers";

// These run only when a local Supabase stack is configured (CI). They prove the
// real access boundaries — not that the code compiles, but that the database
// refuses what it must refuse.
const d = describe.skipIf(!rlsEnvReady());

type Family = { parent: TestUser; studentId: string; childPersonId: string };

let admin: TestUser;
let teacher: TestUser;
let noRole: TestUser;
let famA: Family;
let famB: Family;

const createdPersonIds: string[] = [];
const createdStudentIds: string[] = [];
const createdGuardianIds: string[] = [];
const createdUserIds: string[] = [];

async function makeFamily(): Promise<Family> {
  const svc = serviceClient();
  const parent = await createTestUser(["parent"]);
  createdUserIds.push(parent.id);

  // Parent's own person record, linked to their auth user.
  const { data: parentPerson } = await svc
    .from("person")
    .insert({ full_name: "Parent", auth_user_id: parent.id })
    .select("id")
    .single();
  const parentPersonId = parentPerson!.id as string;
  createdPersonIds.push(parentPersonId);

  const { data: guardian } = await svc
    .from("guardian")
    .insert({ person_id: parentPersonId })
    .select("id")
    .single();
  const guardianId = guardian!.id as string;
  createdGuardianIds.push(guardianId);

  // The child: a separate person + student, with no login.
  const { data: childPerson } = await svc
    .from("person")
    .insert({ full_name: "Child" })
    .select("id")
    .single();
  const childPersonId = childPerson!.id as string;
  createdPersonIds.push(childPersonId);

  const { data: student } = await svc
    .from("student")
    .insert({ person_id: childPersonId, status: "enrolled" })
    .select("id")
    .single();
  const studentId = student!.id as string;
  createdStudentIds.push(studentId);

  await svc
    .from("student_guardian")
    .insert({ student_id: studentId, guardian_id: guardianId });

  return { parent, studentId, childPersonId };
}

beforeAll(async () => {
  if (!rlsEnvReady()) return;

  admin = await createTestUser(["admin"]);
  teacher = await createTestUser(["teacher"]);
  noRole = await createTestUser([]);
  createdUserIds.push(admin.id, teacher.id, noRole.id);

  famA = await makeFamily();
  famB = await makeFamily();
}, 60_000);

afterAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();
  await svc
    .from("student_guardian")
    .delete()
    .in("student_id", createdStudentIds);
  await svc.from("student").delete().in("id", createdStudentIds);
  await svc.from("guardian").delete().in("id", createdGuardianIds);
  await svc.from("person").delete().in("id", createdPersonIds);
  for (const id of createdUserIds) await deleteTestUser(id);
}, 60_000);

d("default-deny", () => {
  it("an anonymous client reads no person rows", async () => {
    const { data } = await anonClient().from("person").select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("an authenticated user with NO role reads no students", async () => {
    const client = await signInAs(noRole);
    const { data } = await client.from("student").select("id");
    expect(data ?? []).toHaveLength(0);
  });
});

d("user_roles is self-only", () => {
  it("a parent sees only their own role rows", async () => {
    const client = await signInAs(famA.parent);
    const { data } = await client.from("user_roles").select("user_id, role");
    expect(data ?? []).not.toHaveLength(0);
    for (const row of data ?? []) {
      expect(row.user_id).toBe(famA.parent.id);
    }
  });

  it("a non-admin cannot grant themselves a role", async () => {
    const client = await signInAs(noRole);
    const { error } = await client
      .from("user_roles")
      .insert({ user_id: noRole.id, role: "admin" });
    expect(error).not.toBeNull();
  });
});

d("parent isolation — the core child-safety boundary", () => {
  it("a parent sees their own child but NOT another family's child", async () => {
    const client = await signInAs(famA.parent);
    const { data } = await client.from("student").select("id");
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(famA.studentId);
    expect(ids).not.toContain(famB.studentId);
  });

  it("a parent cannot fetch another family's child by id", async () => {
    const client = await signInAs(famA.parent);
    const { data } = await client
      .from("student")
      .select("id")
      .eq("id", famB.studentId);
    expect(data ?? []).toHaveLength(0);
  });

  it("a parent cannot read another child's person record", async () => {
    const client = await signInAs(famA.parent);
    const { data } = await client
      .from("person")
      .select("id")
      .eq("id", famB.childPersonId);
    expect(data ?? []).toHaveLength(0);
  });
});

d("staff and admin reach", () => {
  it("a teacher with NO class assignment reads no students (own-class scoping)", async () => {
    // Hardening #2: plain teachers are scoped to their own classes. This
    // teacher teaches nothing, so sees neither family's child.
    const client = await signInAs(teacher);
    const { data } = await client.from("student").select("id");
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).not.toContain(famA.studentId);
    expect(ids).not.toContain(famB.studentId);
  });

  it("a teacher cannot create a student (admissions/admin only)", async () => {
    const svc = serviceClient();
    const { data: p } = await svc
      .from("person")
      .insert({ full_name: "Temp" })
      .select("id")
      .single();
    createdPersonIds.push(p!.id);

    const client = await signInAs(teacher);
    const { error } = await client.from("student").insert({ person_id: p!.id });
    expect(error).not.toBeNull();
  });

  it("an admin can read the audit log; a teacher cannot", async () => {
    const adminClient = await signInAs(admin);
    const { error: adminErr } = await adminClient
      .from("audit_log")
      .select("id")
      .limit(1);
    expect(adminErr).toBeNull();

    const teacherClient = await signInAs(teacher);
    const { data: teacherData } = await teacherClient
      .from("audit_log")
      .select("id");
    expect(teacherData ?? []).toHaveLength(0);
  });
});
