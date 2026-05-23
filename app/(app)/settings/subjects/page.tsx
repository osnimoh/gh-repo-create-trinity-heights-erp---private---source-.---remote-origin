import { requireAdmin } from "@/lib/auth/session";
import { listClassSubjectsDetailed, listStaffWithNames } from "@/lib/db/admin";
import { listClasses } from "@/lib/db/admissions";
import { listSubjects } from "@/lib/db/academics";
import { SettingsNav } from "../nav";
import { ClassSubjectForm } from "./class-subject-form";
import { removeClassSubject } from "../actions";

export default async function ClassSubjectsPage() {
  await requireAdmin();
  const [classes, subjects, staff, assignments] = await Promise.all([
    listClasses(),
    listSubjects(),
    listStaffWithNames(),
    listClassSubjectsDetailed(),
  ]);

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <SettingsNav />

      <h2 className="mt-6 text-base font-semibold">Assign a class subject</h2>
      <p className="text-muted mt-1 mb-3 text-sm">
        The assigned teacher gains access to attendance, results, and report
        cards for that class.
      </p>
      <ClassSubjectForm
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        subjects={subjects}
        staff={staff}
      />

      <h2 className="mt-8 text-base font-semibold">Current class subjects</h2>
      <div className="border-navy/10 mt-2 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Class</th>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">Teacher</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted px-4 py-6 text-center">
                  No class subjects yet.
                </td>
              </tr>
            ) : (
              assignments.map((a) => (
                <tr key={a.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">{a.className}</td>
                  <td className="px-4 py-2">{a.subjectName}</td>
                  <td className="px-4 py-2">{a.teacherName}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={removeClassSubject}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="border-navy/20 hover:bg-cream rounded-md border px-3 py-1 text-xs"
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
