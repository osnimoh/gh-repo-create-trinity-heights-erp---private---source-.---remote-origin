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

// Live-DB only (CI). The CRITICAL workstream: proves the 10% net-fee floor
// holds through the RPC AND the DB CHECK, that payments update status and are
// audited, and that money RLS is tight.
const d = describe.skipIf(!rlsEnvReady());

let bursar: TestUser;
let teacher: TestUser;
let parentA: TestUser;

let academicYearId: string;
let termId: string;
let studentAId: string;
let studentCId: string;
let invoiceAId: string;

const personIds: string[] = [];
const userIds: string[] = [];
const STANDARD = 5000;

beforeAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();

  bursar = await createTestUser(["bursary"]);
  teacher = await createTestUser(["teacher"]);
  parentA = await createTestUser(["parent"]);
  userIds.push(bursar.id, teacher.id, parentA.id);

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

  await svc.from("fee_structure").insert({
    academic_year_id: academicYearId,
    year_group: "shs1",
    amount: STANDARD,
  });

  async function makeStudent(): Promise<string> {
    const { data: p } = await svc
      .from("person")
      .insert({ full_name: "S" })
      .select("id")
      .single();
    personIds.push(p!.id);
    const { data: s } = await svc
      .from("student")
      .insert({ person_id: p!.id, status: "enrolled", year_group: "shs1" })
      .select("id")
      .single();
    return s!.id;
  }
  studentAId = await makeStudent();
  studentCId = await makeStudent();

  // 100% scholarship on student A — must still leave 10% payable.
  await svc.from("scholarship").insert({
    student_id: studentAId,
    name: "Full bursary",
    kind: "percentage",
    value: 100,
  });

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
}, 90_000);

afterAll(async () => {
  if (!rlsEnvReady()) return;
  const svc = serviceClient();
  await svc.from("payment").delete().eq("invoice_id", invoiceAId);
  await svc.from("invoice").delete().in("student_id", [studentAId, studentCId]);
  await svc.from("scholarship").delete().eq("student_id", studentAId);
  await svc
    .from("fee_structure")
    .delete()
    .eq("academic_year_id", academicYearId);
  await svc.from("student_guardian").delete().eq("student_id", studentAId);
  await svc.from("guardian").delete().in("person_id", personIds);
  await svc.from("student").delete().in("id", [studentAId, studentCId]);
  await svc.from("term").delete().eq("id", termId);
  await svc.from("academic_year").delete().eq("id", academicYearId);
  await svc.from("person").delete().in("id", personIds);
  for (const id of userIds) await deleteTestUser(id);
}, 90_000);

d("the 10% net-fee floor", () => {
  it("generate_invoice floors a 100% scholarship at 10% of the standard fee", async () => {
    const client = await signInAs(bursar);
    const { data: invoiceId, error } = await client.rpc("generate_invoice", {
      p_student_id: studentAId,
      p_term_id: termId,
    });
    expect(error).toBeNull();
    invoiceAId = invoiceId as string;

    const svc = serviceClient();
    const { data: inv } = await svc
      .from("invoice")
      .select("standard_amount, discount_amount, net_amount")
      .eq("id", invoiceAId)
      .single();
    expect(Number(inv!.standard_amount)).toBe(STANDARD);
    expect(Number(inv!.net_amount)).toBe(STANDARD * 0.1); // 500
  });

  it("the DB CHECK rejects any invoice that violates the floor", async () => {
    const svc = serviceClient(); // bypasses RLS, but NOT the CHECK constraint
    const { error } = await svc.from("invoice").insert({
      student_id: studentCId,
      term_id: termId,
      standard_amount: STANDARD,
      discount_amount: 4900,
      net_amount: 100, // 2% — below the 10% floor
    });
    expect(error).not.toBeNull();
  });
});

d("payments", () => {
  it("record_payment marks the invoice paid and writes an audit row", async () => {
    const client = await signInAs(bursar);
    const { error } = await client.rpc("record_payment", {
      p_invoice_id: invoiceAId,
      p_amount: 500,
      p_method: "momo",
    });
    expect(error).toBeNull();

    const svc = serviceClient();
    const { data: inv } = await svc
      .from("invoice")
      .select("status, amount_paid")
      .eq("id", invoiceAId)
      .single();
    expect(inv!.status).toBe("paid");
    expect(Number(inv!.amount_paid)).toBe(500);

    const { data: audit } = await svc
      .from("audit_log")
      .select("action")
      .eq("table_name", "payment");
    expect((audit ?? []).length).toBeGreaterThan(0);
  });

  it("a teacher cannot record a payment", async () => {
    const client = await signInAs(teacher);
    const { error } = await client.rpc("record_payment", {
      p_invoice_id: invoiceAId,
      p_amount: 100,
      p_method: "cash",
    });
    expect(error).not.toBeNull();
  });
});

d("money RLS", () => {
  it("a teacher sees no invoices; bursary and the child's parent do", async () => {
    const tch = await signInAs(teacher);
    const { data: tchData } = await tch
      .from("invoice")
      .select("id")
      .eq("id", invoiceAId);
    expect(tchData ?? []).toHaveLength(0);

    const bur = await signInAs(bursar);
    const { data: burData } = await bur
      .from("invoice")
      .select("id")
      .eq("id", invoiceAId);
    expect((burData ?? []).map((i) => i.id)).toContain(invoiceAId);

    const par = await signInAs(parentA);
    const { data: parData } = await par
      .from("invoice")
      .select("id")
      .eq("id", invoiceAId);
    expect((parData ?? []).map((i) => i.id)).toContain(invoiceAId);
  });
});
