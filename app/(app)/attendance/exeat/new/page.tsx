import Link from "next/link";
import { searchStudents } from "@/lib/db/students";
import { listAuthorisedCollectors } from "@/lib/db/exeat";
import { ExeatForm } from "./exeat-form";
import { AttendanceNav } from "../../nav";

export default async function NewExeatPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; q?: string }>;
}) {
  const { student_id, q } = await searchParams;

  if (!student_id) {
    const students = await searchStudents(q);
    return (
      <section className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">New exeat</h1>
        <AttendanceNav />
        <p className="text-muted mt-4">Choose the student going on exeat.</p>

        <form method="get" className="mt-3 flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search students…"
            className="border-navy/20 w-full max-w-md rounded-md border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-navy rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            Search
          </button>
        </form>

        <ul className="divide-navy/5 border-navy/10 mt-4 divide-y rounded-lg border bg-white">
          {students.length === 0 ? (
            <li className="text-muted px-4 py-6 text-center">
              No students found.
            </li>
          ) : (
            students.map((s) => (
              <li key={s.id} className="px-4 py-2">
                <Link
                  href={`/attendance/exeat/new?student_id=${s.id}`}
                  className="text-maroon font-medium hover:underline"
                >
                  {s.person?.full_name ?? "—"}
                </Link>
                <span className="text-muted ml-2 font-mono text-xs">
                  {s.admission_no ?? ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    );
  }

  const collectors = await listAuthorisedCollectors(student_id);
  return (
    <section className="mx-auto max-w-3xl">
      <Link
        href="/attendance/exeat/new"
        className="text-maroon text-sm hover:underline"
      >
        ← Choose a different student
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">New exeat</h1>
      <ExeatForm
        studentId={student_id}
        collectors={collectors.map((c) => ({
          id: c.id,
          name: c.person?.full_name ?? "Guardian",
        }))}
      />
    </section>
  );
}
