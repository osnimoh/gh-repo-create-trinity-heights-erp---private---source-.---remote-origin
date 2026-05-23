import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  createTestUser,
  deleteTestUser,
  rlsEnvReady,
  serviceClient,
  signInAs,
  type TestUser,
} from "./helpers";

// Live-DB only (CI). The RESTRICTED workstream. Headline: safeguarding_flag is
// DSL-only — admin, nurse, teacher and parents are ALL denied. Plus health-record
// scoping, audit, the narrow catering endpoint, and comms audiences.
const d = describe.skipIf(!rlsEnvReady());

let dsl: TestUser;
let nurse: TestUser;
let admin: TestUser;
let teacher: TestUser;
let parentA: TestUser;

let studentAId: string;
let studentBId: string;
let messageParentsId: string;
let messageStaffId: string;

const personIds: string[] = [];
const userIds: string[] = [];

beforeAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();

  dsl = await createTestUser(["dsl"]);
  nurse = await createTestUser(["nurse"]);
  admin = await createTestUser(["admin"]);
  teacher = await createTestUser(["teacher"]);
  parentA = await createTestUser(["parent"]);
  userIds.push(dsl.id, nurse.id, admin.id, teacher.id, parentA.id);

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

  await svc.from("health_record").insert({
    student_id: studentAId,
    allergies: "peanuts",
    blood_group: "O+",
  });
  await svc
    .from("sick_bay_visit")
    .insert({ student_id: studentAId, complaint: "headache" });
  await svc.from("safeguarding_flag").insert({
    student_id: studentAId,
    category: "welfare",
    severity: "high",
    details: "confidential",
  });

  const { data: m1 } = await svc
    .from("message")
    .insert({
      subject: "To parents",
      body: "Hello parents",
      audience: "all_parents",
      sender_user_id: admin.id,
    })
    .select("id")
    .single();
  messageParentsId = m1!.id;
  const { data: m2 } = await svc
    .from("message")
    .insert({
      subject: "To staff",
      body: "Hello staff",
      audience: "all_staff",
      sender_user_id: admin.id,
    })
    .select("id")
    .single();
  messageStaffId = m2!.id;
}, 90_000);

afterAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();
  await svc
    .from("acknowledgement")
    .delete()
    .in("message_id", [messageParentsId, messageStaffId]);
  await svc
    .from("notification")
    .delete()
    .in("message_id", [messageParentsId, messageStaffId]);
  await svc
    .from("message")
    .delete()
    .in("id", [messageParentsId, messageStaffId]);
  await svc.from("safeguarding_flag").delete().eq("student_id", studentAId);
  await svc.from("sick_bay_visit").delete().eq("student_id", studentAId);
  await svc.from("health_record").delete().eq("student_id", studentAId);
  await svc.from("student_guardian").delete().eq("student_id", studentAId);
  await svc.from("guardian").delete().in("person_id", personIds);
  await svc.from("student").delete().in("id", [studentAId, studentBId]);
  await svc.from("person").delete().in("id", personIds);
  for (const id of userIds) await deleteTestUser(id);
}, 90_000);

d("safeguarding_flag is DSL-ONLY (the hardest boundary)", () => {
  it("the DSL can read safeguarding flags", async () => {
    const client = await signInAs(dsl);
    const { data } = await client.from("safeguarding_flag").select("id");
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("admin, nurse, teacher and parent ALL see nothing", async () => {
    for (const u of [admin, nurse, teacher, parentA]) {
      const client = await signInAs(u);
      const { data } = await client.from("safeguarding_flag").select("id");
      expect(data ?? []).toHaveLength(0);
    }
  });

  it("a non-DSL user cannot insert a safeguarding flag", async () => {
    const client = await signInAs(admin);
    const { error } = await client
      .from("safeguarding_flag")
      .insert({ student_id: studentBId, category: "x", severity: "low" });
    expect(error).not.toBeNull();
  });

  it("safeguarding writes are audited", async () => {
    const svc = serviceClient();
    const { data } = await svc
      .from("audit_log")
      .select("action")
      .eq("table_name", "safeguarding_flag");
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});

d("health records", () => {
  it("the nurse and the child's parent can read; teacher and DSL cannot", async () => {
    const nurseClient = await signInAs(nurse);
    const { data: n } = await nurseClient
      .from("health_record")
      .select("id")
      .eq("student_id", studentAId);
    expect((n ?? []).length).toBe(1);

    const parentClient = await signInAs(parentA);
    const { data: p } = await parentClient
      .from("health_record")
      .select("id")
      .eq("student_id", studentAId);
    expect((p ?? []).length).toBe(1);

    for (const u of [teacher, dsl]) {
      const c = await signInAs(u);
      const { data } = await c.from("health_record").select("id");
      expect(data ?? []).toHaveLength(0);
    }
  });

  it("a parent cannot read another child's health record", async () => {
    const client = await signInAs(parentA);
    const { data } = await client
      .from("health_record")
      .select("id")
      .eq("student_id", studentBId);
    expect(data ?? []).toHaveLength(0);
  });

  it("health writes are audited", async () => {
    const svc = serviceClient();
    const { data } = await svc
      .from("audit_log")
      .select("action")
      .eq("table_name", "health_record");
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});

d("catering endpoint is not exposed to app users", () => {
  it("an authenticated user cannot call catering_allergies()", async () => {
    const client = await signInAs(nurse);
    const { error } = await client.rpc("catering_allergies");
    expect(error).not.toBeNull();
  });
});

d("message audiences", () => {
  it("a parent sees parent broadcasts but not staff broadcasts", async () => {
    const client = await signInAs(parentA);
    const { data } = await client.from("message").select("id");
    const ids = (data ?? []).map((m) => m.id);
    expect(ids).toContain(messageParentsId);
    expect(ids).not.toContain(messageStaffId);
  });

  it("a teacher sees staff broadcasts but not parent broadcasts", async () => {
    const client = await signInAs(teacher);
    const { data } = await client.from("message").select("id");
    const ids = (data ?? []).map((m) => m.id);
    expect(ids).toContain(messageStaffId);
    expect(ids).not.toContain(messageParentsId);
  });

  it("a user may acknowledge as themselves but not as someone else", async () => {
    const client = await signInAs(parentA);
    const ok = await client
      .from("acknowledgement")
      .insert({ message_id: messageParentsId, user_id: parentA.id });
    expect(ok.error).toBeNull();

    const bad = await client
      .from("acknowledgement")
      .insert({ message_id: messageParentsId, user_id: teacher.id });
    expect(bad.error).not.toBeNull();
  });
});
