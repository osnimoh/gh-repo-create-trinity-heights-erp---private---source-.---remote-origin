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

// Live-DB only (CI). Review finding #4: house_staff is scoped to their assigned
// house for boarding roll, exeat, and student identity.
const d = describe.skipIf(!rlsEnvReady());

let houseStaffA: TestUser;
let houseStaffB: TestUser;

let academicYearId: string;
let classId: string;
let houseAId: string;
let houseBId: string;
let studentAId: string;
let studentBId: string;

const personIds: string[] = [];
const userIds: string[] = [];

beforeAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();

  houseStaffA = await createTestUser(["house_staff"]);
  houseStaffB = await createTestUser(["house_staff"]);
  userIds.push(houseStaffA.id, houseStaffB.id);

  // Two of the four seeded houses.
  const { data: houses } = await svc
    .from("house")
    .select("id")
    .order("name")
    .limit(2);
  houseAId = houses![0].id;
  houseBId = houses![1].id;

  async function assignHouseStaff(user: TestUser, houseId: string) {
    const { data: p } = await svc
      .from("person")
      .insert({ full_name: "House Staff", auth_user_id: user.id })
      .select("id")
      .single();
    personIds.push(p!.id);
    const { data: s } = await svc
      .from("staff")
      .insert({ person_id: p!.id })
      .select("id")
      .single();
    await svc
      .from("staff_house")
      .insert({ staff_id: s!.id, house_id: houseId });
  }
  await assignHouseStaff(houseStaffA, houseAId);
  await assignHouseStaff(houseStaffB, houseBId);

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
    })
    .select("id")
    .single();
  classId = klass!.id;

  async function makeStudent(houseId: string) {
    const { data: p } = await svc
      .from("person")
      .insert({ full_name: "Boarder" })
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
      house_id: houseId,
      status: "active",
    });
    await svc
      .from("boarding_roll")
      .insert({ student_id: s!.id, house_id: houseId, present: true });
    await svc.from("exeat").insert({ student_id: s!.id, reason: "weekend" });
    return s!.id as string;
  }
  studentAId = await makeStudent(houseAId);
  studentBId = await makeStudent(houseBId);
});

afterAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();
  const students = [studentAId, studentBId];
  await svc.from("exeat").delete().in("student_id", students);
  await svc.from("boarding_roll").delete().in("student_id", students);
  await svc.from("enrolment").delete().in("student_id", students);
  await svc.from("student").delete().in("id", students);
  await svc.from("staff_house").delete().in("house_id", [houseAId, houseBId]);
  await svc.from("staff").delete().in("person_id", personIds);
  await svc.from("class").delete().eq("id", classId);
  await svc.from("academic_year").delete().eq("id", academicYearId);
  await svc.from("person").delete().in("id", personIds);
  for (const id of userIds) await deleteTestUser(id);
});

d("house_staff is scoped to their assigned house", () => {
  it("reads the boarding roll for their house only", async () => {
    const a = await signInAs(houseStaffA);
    const { data } = await a.from("boarding_roll").select("student_id");
    const ids = (data ?? []).map((r) => r.student_id);
    expect(ids).toContain(studentAId);
    expect(ids).not.toContain(studentBId);
  });

  it("reads exeats for their house only", async () => {
    const a = await signInAs(houseStaffA);
    const { data } = await a.from("exeat").select("student_id");
    const ids = (data ?? []).map((r) => r.student_id);
    expect(ids).toContain(studentAId);
    expect(ids).not.toContain(studentBId);
  });

  it("reads student identity for their house only", async () => {
    const a = await signInAs(houseStaffA);
    const { data } = await a.from("student").select("id");
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(studentAId);
    expect(ids).not.toContain(studentBId);
  });

  it("the other house's staff sees the mirror image", async () => {
    const b = await signInAs(houseStaffB);
    const { data } = await b.from("boarding_roll").select("student_id");
    const ids = (data ?? []).map((r) => r.student_id);
    expect(ids).toContain(studentBId);
    expect(ids).not.toContain(studentAId);
  });

  it("cannot write a boarding roll for a house it doesn't manage", async () => {
    const a = await signInAs(houseStaffA);
    const { error } = await a
      .from("boarding_roll")
      .insert({ student_id: studentBId, house_id: houseBId, present: false });
    expect(error).not.toBeNull();
  });
});
