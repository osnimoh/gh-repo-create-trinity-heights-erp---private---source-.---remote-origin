import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  createTestUser,
  deleteTestUser,
  rlsEnvReady,
  serviceClient,
  signInAs,
  type TestUser,
} from "./helpers";

// Live-DB only (CI). Verifies teacher class-scoping for attendance, the exeat
// authorised-collector integrity trigger, and parent isolation.
const d = describe.skipIf(!rlsEnvReady());

let admin: TestUser;
let teacher: TestUser;
let parentA: TestUser;
let parentB: TestUser;

let academicYearId: string;
let classId: string;
let otherClassId: string;
let studentAId: string;
let studentBId: string;
let guardianAId: string;
let guardianXId: string;

const personIds: string[] = [];
const userIds: string[] = [];
const exeatIds: string[] = [];

async function insertPerson(authUserId?: string): Promise<string> {
  const svc = serviceClient();
  const { data } = await svc
    .from("person")
    .insert({ full_name: "T", auth_user_id: authUserId ?? null })
    .select("id")
    .single();
  personIds.push(data!.id);
  return data!.id;
}

beforeAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();

  admin = await createTestUser(["admin"]);
  teacher = await createTestUser(["teacher"]);
  parentA = await createTestUser(["parent"]);
  parentB = await createTestUser(["parent"]);
  userIds.push(admin.id, teacher.id, parentA.id, parentB.id);

  // Teacher's staff record.
  const teacherPersonId = await insertPerson(teacher.id);
  const { data: staff } = await svc
    .from("staff")
    .insert({ person_id: teacherPersonId })
    .select("id")
    .single();
  const staffId = staff!.id;

  const { data: year } = await svc
    .from("academic_year")
    .insert({ name: `AY ${randomUUID().slice(0, 8)}`, starts_on: "2028-09-01" })
    .select("id")
    .single();
  academicYearId = year!.id;

  const { data: klass } = await svc
    .from("class")
    .insert({
      academic_year_id: academicYearId,
      year_group: "shs1",
      name: `Class ${randomUUID().slice(0, 8)}`,
      form_teacher_staff_id: staffId,
    })
    .select("id")
    .single();
  classId = klass!.id;

  const { data: other } = await svc
    .from("class")
    .insert({
      academic_year_id: academicYearId,
      year_group: "shs1",
      name: `Class ${randomUUID().slice(0, 8)}`,
    })
    .select("id")
    .single();
  otherClassId = other!.id;

  // Two students enrolled in the teacher's class.
  async function makeStudent(): Promise<string> {
    const pid = await insertPerson();
    const { data: s } = await svc
      .from("student")
      .insert({ person_id: pid, status: "enrolled" })
      .select("id")
      .single();
    await svc.from("enrolment").insert({
      student_id: s!.id,
      academic_year_id: academicYearId,
      class_id: classId,
      status: "active",
    });
    return s!.id;
  }
  studentAId = await makeStudent();
  studentBId = await makeStudent();

  // parentA guardians studentA, authorised collector.
  const personPAId = await insertPerson(parentA.id);
  const { data: gA } = await svc
    .from("guardian")
    .insert({ person_id: personPAId })
    .select("id")
    .single();
  guardianAId = gA!.id;
  await svc.from("student_guardian").insert({
    student_id: studentAId,
    guardian_id: guardianAId,
    is_authorised_collector: true,
  });

  // guardianX linked to studentA but NOT an authorised collector.
  const personXId = await insertPerson();
  const { data: gX } = await svc
    .from("guardian")
    .insert({ person_id: personXId })
    .select("id")
    .single();
  guardianXId = gX!.id;
  await svc.from("student_guardian").insert({
    student_id: studentAId,
    guardian_id: guardianXId,
    is_authorised_collector: false,
  });

  // parentB guardians studentB.
  const personPBId = await insertPerson(parentB.id);
  const { data: gB } = await svc
    .from("guardian")
    .insert({ person_id: personPBId })
    .select("id")
    .single();
  await svc.from("student_guardian").insert({
    student_id: studentBId,
    guardian_id: gB!.id,
    is_authorised_collector: true,
  });

  // Seed attendance via the RPC, as the class's teacher.
  const teacherClient = await signInAs(teacher);
  await teacherClient.rpc("save_attendance", {
    p_class_id: classId,
    p_session_date: "2028-09-05",
    p_session_type: "morning",
    p_marks: [
      { student_id: studentAId, status: "present" },
      { student_id: studentBId, status: "absent" },
    ],
  });
}, 90_000);

afterAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();
  await svc.from("exeat").delete().in("id", exeatIds);
  await svc
    .from("attendance_mark")
    .delete()
    .in("student_id", [studentAId, studentBId]);
  await svc.from("attendance_session").delete().eq("class_id", classId);
  await svc
    .from("student_guardian")
    .delete()
    .in("student_id", [studentAId, studentBId]);
  await svc
    .from("enrolment")
    .delete()
    .in("student_id", [studentAId, studentBId]);
  await svc.from("student").delete().in("id", [studentAId, studentBId]);
  await svc.from("guardian").delete().in("id", [guardianAId, guardianXId]);
  await svc.from("class").delete().in("id", [classId, otherClassId]);
  await svc.from("academic_year").delete().eq("id", academicYearId);
  await svc.from("person").delete().in("id", personIds);
  for (const id of userIds) await deleteTestUser(id);
}, 90_000);

d("save_attendance + class scoping", () => {
  it("recorded both marks for the teacher's class", async () => {
    const svc = serviceClient();
    const { data: session } = await svc
      .from("attendance_session")
      .select("id")
      .eq("class_id", classId)
      .single();
    const { data: marks } = await svc
      .from("attendance_mark")
      .select("student_id, status")
      .eq("attendance_session_id", session!.id);
    expect(marks).toHaveLength(2);
  });

  it("a teacher cannot take attendance for a class they don't teach", async () => {
    const client = await signInAs(teacher);
    const { error } = await client.rpc("save_attendance", {
      p_class_id: otherClassId,
      p_session_date: "2028-09-05",
      p_session_type: "morning",
      p_marks: [{ student_id: studentAId, status: "present" }],
    });
    expect(error).not.toBeNull();
  });
});

d("attendance_mark parent isolation", () => {
  it("a parent sees only their own child's marks", async () => {
    const client = await signInAs(parentA);
    const { data } = await client.from("attendance_mark").select("student_id");
    const ids = (data ?? []).map((m) => m.student_id);
    expect(ids).toContain(studentAId);
    expect(ids).not.toContain(studentBId);
  });
});

d("exeat authorised-collector integrity", () => {
  it("rejects an exeat whose collector is not authorised", async () => {
    const svc = serviceClient();
    const { error } = await svc.from("exeat").insert({
      student_id: studentAId,
      collector_guardian_id: guardianXId,
    });
    expect(error).not.toBeNull();
  });

  it("accepts an exeat with an authorised collector", async () => {
    const svc = serviceClient();
    const { data, error } = await svc
      .from("exeat")
      .insert({ student_id: studentAId, collector_guardian_id: guardianAId })
      .select("id")
      .single();
    expect(error).toBeNull();
    if (data?.id) exeatIds.push(data.id);
  });
});

d("exeat parent isolation", () => {
  it("a parent sees their own child's exeat, not another family's", async () => {
    const a = await signInAs(parentA);
    const { data: aData } = await a.from("exeat").select("student_id");
    expect((aData ?? []).map((e) => e.student_id)).toContain(studentAId);

    const b = await signInAs(parentB);
    const { data: bData } = await b.from("exeat").select("student_id");
    expect((bData ?? []).map((e) => e.student_id)).not.toContain(studentAId);
  });
});
