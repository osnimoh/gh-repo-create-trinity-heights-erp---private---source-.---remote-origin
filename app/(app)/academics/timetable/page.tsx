import { AcademicsNav } from "../nav";
import { TimetableForm } from "./timetable-form";
import { getTimetable, listSubjects } from "@/lib/db/academics";
import { listClasses } from "@/lib/db/admissions";
import { dayLabel } from "@/lib/constants";

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string }>;
}) {
  const { class_id } = await searchParams;
  const [classes, subjects] = await Promise.all([
    listClasses(),
    listSubjects(),
  ]);
  const entries = class_id ? await getTimetable(class_id) : [];

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Academics</h1>
      <AcademicsNav />

      <form method="get" className="mt-4 flex items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Class</span>
          <select
            name="class_id"
            defaultValue={class_id ?? ""}
            className="border-navy/20 rounded-md border px-3 py-2"
          >
            <option value="">Choose…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-navy rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Load
        </button>
      </form>

      {class_id ? (
        <>
          <div className="border-navy/10 mt-6 overflow-hidden rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-navy">
                <tr>
                  <th className="px-4 py-2 font-medium">Day</th>
                  <th className="px-4 py-2 font-medium">Period</th>
                  <th className="px-4 py-2 font-medium">Subject</th>
                  <th className="px-4 py-2 font-medium">Room</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-muted px-4 py-6 text-center"
                    >
                      No timetable slots yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((e) => (
                    <tr key={e.id} className="border-navy/5 border-t">
                      <td className="px-4 py-2">{dayLabel(e.day_of_week)}</td>
                      <td className="px-4 py-2">{e.period_no}</td>
                      <td className="px-4 py-2">{e.subject?.name ?? "—"}</td>
                      <td className="px-4 py-2">{e.room ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mt-8 text-base font-semibold">Add / update a slot</h2>
          <div className="border-navy/10 mt-2 rounded-lg border bg-white p-4">
            <TimetableForm classId={class_id} subjects={subjects} />
          </div>
        </>
      ) : (
        <p className="text-muted mt-4">Choose a class to view its timetable.</p>
      )}
    </section>
  );
}
