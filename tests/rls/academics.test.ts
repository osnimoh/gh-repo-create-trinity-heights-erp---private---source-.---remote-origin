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

// Live-DB only (CI). Teacher own-class result entry, result audit + parent
// isolation, and report-card assembly.
const d = describe.skipIf(!rlsEnvReady());

let teacher: TestUser;
let otherTeacher: TestUser;
let parentA: TestUser;

let academicYearId: string;
let termId: string;
let assessmentId: string;
let studentAId: string;
let studentBId: string;
let reportStudentClassId: string;

const personIds: string[] = [];
const userIds: string[] = [];

beforeAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();

  teacher = await createTestUser(["teacher"]);
  otherTeacher = await createTestUser(["teacher"]);
  parentA = await createTestUser(["parent"]);
  userIds.push(teacher.id, otherTeacher.id, parentA.id);

  async function makeStaff(authId: string): Promise<string> {
    const { data: p } = await svc
      .from("person")
      .insert({ full_name: "Staff", auth_user_id: authId })
      .select("id")
      .single();
    personIds.push(p!.id);
    const { data: s } = await svc
      .from("staff")
      .insert({ person_id: p!.id })
      .select("id")
      .single();
    return s!.id;
  }
  const staffId = await makeStaff(teacher.id);
  await makeStaff(otherTeacher.id);

  const { data: year } = await svc
    .from("academic_year")
    .insert({ name: `AY ${randomUUID().slice(0, 8)}`, starts_on: "2028-09-01" })
    .select("id")
    .single();
  academicYearId = year!.id;

  const { data: term } = await svc
    .from("term")
    .insert({ academic_year_id: academicYearId, number: 1, name: "Term 1" })
    .select("id")
    .single();
  termId = term!.id;

  const { data: subject } = await svc
    .from("subject")
    .insert({ name: `Maths ${randomUUID().slice(0, 6)}` })
    .select("id")
    .single();

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
  reportStudentClassId = klass!.id;

  const { data: cs } = await svc
    .from("class_subject")
    .insert({
      class_id: klass!.id,
      subject_id: subject!.id,
      teacher_staff_id: staffId,
    })
    .select("id")
    .single();

  async function makeStudent(): Promise<string> {
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
      class_id: klass!.id,
      status: "active",
    });
    return s!.id;
  }
  studentAId = await makeStudent();
  studentBId = await makeStudent();

  // parent A guardians student A.
  const { data: pa } = await svc
    .from("person")
    .insert({ full_name: "Parent A", auth_user_id: parentA.id })
    .select("id")
    .single();
  personIds.push(pa!.id);
  const { data: gA } = await svc
    .from("guardian")
    .insert({ person_id: pa!.id })
    .select("id")
    .single();
  await svc
    .from("student_guardian")
    .insert({ student_id: studentAId, guardian_id: gA!.id });

  const { data: assessment } = await svc
    .from("assessment")
    .insert({
      class_subject_id: cs!.id,
      term_id: termId,
      name: "End of term",
      max_score: 100,
      weight: 1,
    })
    .select("id")
    .single();
  assessmentId = assessment!.id;
}, 90_000);

afterAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();
  await svc.from("result").delete().eq("assessment_id", assessmentId);
  await svc
    .from("report_card")
    .delete()
    .in("student_id", [studentAId, studentBId]);
  await svc.from("assessment").delete().eq("id", assessmentId);
  await svc
    .from("enrolment")
    .delete()
    .in("student_id", [studentAId, studentBId]);
  await svc.from("student_guardian").delete().eq("student_id", studentAId);
  await svc.from("student").delete().in("id", [studentAId, studentBId]);
  await svc.from("class_subject").delete().eq("class_id", reportStudentClassId);
  await svc.from("guardian").delete().in("person_id", personIds);
  await svc.from("class").delete().eq("id", reportStudentClassId);
  await svc.from("term").delete().eq("id", termId);
  await svc.from("academic_year").delete().eq("id", academicYearId);
  await svc.from("staff").delete().in("person_id", personIds);
  await svc.from("person").delete().in("id", personIds);
  for (const id of userIds) await deleteTestUser(id);
}, 90_000);

d("result entry is scoped to the class teacher", () => {
  it("the class teacher can save results", async () => {
    const client = await signInAs(teacher);
    const { error } = await client.rpc("save_results", {
      p_assessment_id: assessmentId,
      p_marks: [
        { student_id: studentAId, score: 80 },
        { student_id: studentBId, score: 40 },
      ],
    });
    expect(error).toBeNull();

    const svc = serviceClient();
    const { data } = await svc
      .from("result")
      .select("student_id")
      .eq("assessment_id", assessmentId);
    expect((data ?? []).length).toBe(2);
  });

  it("a teacher who doesn't teach the class cannot save results", async () => {
    const client = await signInAs(otherTeacher);
    const { error } = await client.rpc("save_results", {
      p_assessment_id: assessmentId,
      p_marks: [{ student_id: studentAId, score: 99 }],
    });
    expect(error).not.toBeNull();
  });
});

d("result audit + parent isolation", () => {
  it("writes audit rows for results", async () => {
    const svc = serviceClient();
    const { data } = await svc
      .from("audit_log")
      .select("action")
      .eq("table_name", "result");
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("a parent sees only their own child's result", async () => {
    const client = await signInAs(parentA);
    const { data } = await client.from("result").select("student_id");
    const ids = (data ?? []).map((r) => r.student_id);
    expect(ids).toContain(studentAId);
    expect(ids).not.toContain(studentBId);
  });
});

d("report card assembly", () => {
  it("assembles per-subject percent/grade and an overall average", async () => {
    const client = await signInAs(teacher);
    const { error } = await client.rpc("generate_report_card", {
      p_student_id: studentAId,
      p_term_id: termId,
    });
    expect(error).toBeNull();

    const svc = serviceClient();
    const { data: card } = await svc
      .from("report_card")
      .select("overall_average, overall_grade, subjects")
      .eq("student_id", studentAId)
      .eq("term_id", termId)
      .single();
    expect(Number(card!.overall_average)).toBe(80);
    expect(card!.overall_grade).toBe("A1");

    const subjects = card!.subjects as unknown as {
      subject: string;
      percent: number;
      grade: string;
    }[];
    expect(subjects).toHaveLength(1);
    expect(Number(subjects[0].percent)).toBe(80);
    expect(subjects[0].grade).toBe("A1");
  });
});
