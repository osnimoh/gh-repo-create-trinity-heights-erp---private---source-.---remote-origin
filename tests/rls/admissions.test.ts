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

// Runs only with a live Supabase stack (CI). Verifies the admissions pipeline
// and its access boundaries against real Postgres + RLS.
const d = describe.skipIf(!rlsEnvReady());

let admissions: TestUser;
let teacher: TestUser;
let academicYearId: string;

const personIds: string[] = [];
const studentIds: string[] = [];
const applicationIds: string[] = [];
const guardianIds: string[] = [];
const userIds: string[] = [];

async function newApplicant(): Promise<{
  personId: string;
  applicationId: string;
}> {
  const svc = serviceClient();
  const { data: person } = await svc
    .from("person")
    .insert({ full_name: `Applicant ${randomUUID().slice(0, 8)}` })
    .select("id")
    .single();
  personIds.push(person!.id);

  const { data: app } = await svc
    .from("application")
    .insert({
      person_id: person!.id,
      academic_year_id: academicYearId,
      stream: "science",
      status: "accepted",
    })
    .select("id")
    .single();
  applicationIds.push(app!.id);

  return { personId: person!.id, applicationId: app!.id };
}

beforeAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();

  admissions = await createTestUser(["admissions"]);
  teacher = await createTestUser(["teacher"]);
  userIds.push(admissions.id, teacher.id);

  const { data: year } = await svc
    .from("academic_year")
    .insert({
      name: `TEST ${randomUUID().slice(0, 8)}`,
      starts_on: "2028-09-01",
    })
    .select("id")
    .single();
  academicYearId = year!.id;
}, 60_000);

afterAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();
  await svc.from("enrolment").delete().in("student_id", studentIds);
  await svc.from("student").delete().in("id", studentIds);
  await svc.from("student_guardian").delete().in("guardian_id", guardianIds);
  await svc.from("guardian").delete().in("id", guardianIds);
  await svc.from("application").delete().in("id", applicationIds);
  await svc.from("person").delete().in("id", personIds);
  await svc.from("academic_year").delete().eq("id", academicYearId);
  for (const id of userIds) await deleteTestUser(id);
}, 60_000);

d("enrol_applicant RPC", () => {
  it("admissions can enrol: returns a THS admission no and flips the application", async () => {
    const { applicationId } = await newApplicant();
    const client = await signInAs(admissions);

    const { data, error } = await client.rpc("enrol_applicant", {
      p_application_id: applicationId,
      p_academic_year_id: academicYearId,
    });
    expect(error).toBeNull();
    const row = data?.[0];
    expect(row?.admission_no).toMatch(/^THS\d{4}-\d{4}$/);
    if (row?.student_id) studentIds.push(row.student_id);

    const svc = serviceClient();
    const { data: app } = await svc
      .from("application")
      .select("status")
      .eq("id", applicationId)
      .single();
    expect(app?.status).toBe("enrolled");

    const { data: student } = await svc
      .from("student")
      .select("status, admission_no")
      .eq("id", row!.student_id)
      .single();
    expect(student?.status).toBe("enrolled");
    expect(student?.admission_no).toBe(row?.admission_no);
  });

  it("a teacher cannot enrol (admissions/admin only)", async () => {
    const { applicationId } = await newApplicant();
    const client = await signInAs(teacher);
    const { error } = await client.rpc("enrol_applicant", {
      p_application_id: applicationId,
      p_academic_year_id: academicYearId,
    });
    expect(error).not.toBeNull();
  });
});

d("application RLS", () => {
  it("admissions can read applications; a teacher cannot", async () => {
    const { applicationId } = await newApplicant();

    const adm = await signInAs(admissions);
    const { data: admData } = await adm
      .from("application")
      .select("id")
      .eq("id", applicationId);
    expect((admData ?? []).map((r) => r.id)).toContain(applicationId);

    const tch = await signInAs(teacher);
    const { data: tchData } = await tch
      .from("application")
      .select("id")
      .eq("id", applicationId);
    expect(tchData ?? []).toHaveLength(0);
  });
});

d("enrolment parent isolation", () => {
  it("a parent sees only their own child's enrolment", async () => {
    const svc = serviceClient();

    async function family() {
      const parent = await createTestUser(["parent"]);
      userIds.push(parent.id);
      const { data: pPerson } = await svc
        .from("person")
        .insert({ full_name: "P", auth_user_id: parent.id })
        .select("id")
        .single();
      personIds.push(pPerson!.id);
      const { data: guardian } = await svc
        .from("guardian")
        .insert({ person_id: pPerson!.id })
        .select("id")
        .single();
      guardianIds.push(guardian!.id);
      const { data: cPerson } = await svc
        .from("person")
        .insert({ full_name: "C" })
        .select("id")
        .single();
      personIds.push(cPerson!.id);
      const { data: student } = await svc
        .from("student")
        .insert({ person_id: cPerson!.id, status: "enrolled" })
        .select("id")
        .single();
      studentIds.push(student!.id);
      await svc
        .from("student_guardian")
        .insert({ student_id: student!.id, guardian_id: guardian!.id });
      await svc
        .from("enrolment")
        .insert({ student_id: student!.id, academic_year_id: academicYearId });
      return { parent, studentId: student!.id };
    }

    const a = await family();
    const b = await family();

    const client = await signInAs(a.parent);
    const { data } = await client.from("enrolment").select("student_id");
    const ids = (data ?? []).map((r) => r.student_id);
    expect(ids).toContain(a.studentId);
    expect(ids).not.toContain(b.studentId);
  });
});
