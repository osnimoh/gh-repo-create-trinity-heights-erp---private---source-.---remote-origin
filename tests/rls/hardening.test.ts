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

// Live-DB only (CI). Verifies the WS8 hardening from the policy review:
// #2 teacher own-class identity scoping, #3 guardian scoping, #1 safeguarding
// audit metadata is DSL-only (admin can't see it).
const d = describe.skipIf(!rlsEnvReady());

let teacher: TestUser;
let otherTeacher: TestUser;
let admin: TestUser;
let dsl: TestUser;

let academicYearId: string;
let classInId: string;
let classOutId: string;
let studentInId: string;
let studentInPersonId: string;
let studentOutId: string;
let studentOutPersonId: string;
let guardianInId: string;

const personIds: string[] = [];
const userIds: string[] = [];

beforeAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();

  teacher = await createTestUser(["teacher"]);
  otherTeacher = await createTestUser(["teacher"]);
  admin = await createTestUser(["admin"]);
  dsl = await createTestUser(["dsl"]);
  userIds.push(teacher.id, otherTeacher.id, admin.id, dsl.id);

  // Teacher's staff record.
  const { data: tp } = await svc
    .from("person")
    .insert({ full_name: "Teacher", auth_user_id: teacher.id })
    .select("id")
    .single();
  personIds.push(tp!.id);
  const { data: staff } = await svc
    .from("staff")
    .insert({ person_id: tp!.id })
    .select("id")
    .single();
  const staffId = staff!.id;

  const { data: year } = await svc
    .from("academic_year")
    .insert({ name: `AY ${randomUUID().slice(0, 8)}`, starts_on: "2028-09-01" })
    .select("id")
    .single();
  academicYearId = year!.id;

  const mkClass = async (formTeacher: string | null) => {
    const { data } = await svc
      .from("class")
      .insert({
        academic_year_id: academicYearId,
        year_group: "shs1",
        name: `Class ${randomUUID().slice(0, 8)}`,
        form_teacher_staff_id: formTeacher,
      })
      .select("id")
      .single();
    return data!.id as string;
  };
  classInId = await mkClass(staffId); // teacher teaches this
  classOutId = await mkClass(null); // teacher does NOT teach this

  const mkStudent = async (classId: string) => {
    const { data: p } = await svc
      .from("person")
      .insert({ full_name: "Pupil" })
      .select("id")
      .single();
    personIds.push(p!.id);
    const { data: s } = await svc
      .from("student")
      .insert({ person_id: p!.id, status: "enrolled" })
      .select("id")
      .single();
    await svc.from("enrolment").insert({
      student_id: s!.id,
      academic_year_id: academicYearId,
      class_id: classId,
      status: "active",
    });
    return { studentId: s!.id as string, personId: p!.id as string };
  };
  ({ studentId: studentInId, personId: studentInPersonId } =
    await mkStudent(classInId));
  ({ studentId: studentOutId, personId: studentOutPersonId } =
    await mkStudent(classOutId));

  // A guardian for the in-class student.
  const { data: gp } = await svc
    .from("person")
    .insert({ full_name: "Guardian" })
    .select("id")
    .single();
  personIds.push(gp!.id);
  const { data: g } = await svc
    .from("guardian")
    .insert({ person_id: gp!.id })
    .select("id")
    .single();
  guardianInId = g!.id;
  await svc
    .from("student_guardian")
    .insert({ student_id: studentInId, guardian_id: guardianInId });

  // A safeguarding flag → produces an audit_log row we can probe.
  await svc.from("safeguarding_flag").insert({
    student_id: studentInId,
    category: "welfare",
    severity: "low",
  });
});

afterAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();
  await svc
    .from("safeguarding_flag")
    .delete()
    .in("student_id", [studentInId, studentOutId]);
  await svc.from("student_guardian").delete().eq("student_id", studentInId);
  await svc.from("guardian").delete().eq("id", guardianInId);
  await svc
    .from("enrolment")
    .delete()
    .in("student_id", [studentInId, studentOutId]);
  await svc.from("student").delete().in("id", [studentInId, studentOutId]);
  await svc.from("class").delete().in("id", [classInId, classOutId]);
  await svc.from("academic_year").delete().eq("id", academicYearId);
  await svc.from("staff").delete().in("person_id", personIds);
  await svc.from("person").delete().in("id", personIds);
  for (const id of userIds) await deleteTestUser(id);
});

d("#2 teacher own-class identity scoping", () => {
  it("a teacher reads only their own-class student (not another class)", async () => {
    const client = await signInAs(teacher);
    const { data } = await client.from("student").select("id");
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(studentInId);
    expect(ids).not.toContain(studentOutId);
  });

  it("a teacher reads the person of their own-class student only", async () => {
    const client = await signInAs(teacher);
    const inRow = await client
      .from("person")
      .select("id")
      .eq("id", studentInPersonId);
    expect((inRow.data ?? []).length).toBe(1);
    const outRow = await client
      .from("person")
      .select("id")
      .eq("id", studentOutPersonId);
    expect(outRow.data ?? []).toHaveLength(0);
  });
});

d("#3 guardian scoping", () => {
  it("the class teacher reads their student's guardian; another teacher cannot", async () => {
    const t = await signInAs(teacher);
    const ok = await t.from("guardian").select("id").eq("id", guardianInId);
    expect((ok.data ?? []).length).toBe(1);

    const other = await signInAs(otherTeacher);
    const denied = await other
      .from("guardian")
      .select("id")
      .eq("id", guardianInId);
    expect(denied.data ?? []).toHaveLength(0);
  });
});

d("#1 safeguarding audit is DSL-only metadata", () => {
  it("admin canNOT see safeguarding audit rows; DSL can", async () => {
    const adminClient = await signInAs(admin);
    const adminRows = await adminClient
      .from("audit_log")
      .select("id")
      .eq("table_name", "safeguarding_flag");
    expect(adminRows.data ?? []).toHaveLength(0);

    const dslClient = await signInAs(dsl);
    const dslRows = await dslClient
      .from("audit_log")
      .select("table_name")
      .eq("table_name", "safeguarding_flag");
    expect((dslRows.data ?? []).length).toBeGreaterThan(0);

    // And the DSL sees ONLY safeguarding audit rows, nothing else.
    const dslAll = await dslClient.from("audit_log").select("table_name");
    for (const row of dslAll.data ?? []) {
      expect(row.table_name).toBe("safeguarding_flag");
    }
  });
});
