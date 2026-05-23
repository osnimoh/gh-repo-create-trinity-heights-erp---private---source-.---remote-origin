import { listAcademicYears } from "@/lib/db/admissions";
import { listFeeStructures } from "@/lib/db/fees";
import { FeeStructureForm } from "./structure-form";
import { FeesNav } from "../nav";
import { formatCedis, yearGroupLabel } from "@/lib/constants";

export default async function FeeStructuresPage() {
  const [years, structures] = await Promise.all([
    listAcademicYears(),
    listFeeStructures(),
  ]);

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Fees</h1>
      <FeesNav />

      <h2 className="mt-6 text-base font-semibold">Fee structure</h2>
      <div className="border-navy/10 mt-2 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="px-4 py-2 font-medium">Year</th>
              <th className="px-4 py-2 font-medium">Year group</th>
              <th className="px-4 py-2 font-medium">Standard fee</th>
            </tr>
          </thead>
          <tbody>
            {structures.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted px-4 py-6 text-center">
                  No fee structures set.
                </td>
              </tr>
            ) : (
              structures.map((f) => (
                <tr key={f.id} className="border-navy/5 border-t">
                  <td className="px-4 py-2">{f.academic_year?.name ?? "—"}</td>
                  <td className="px-4 py-2">{yearGroupLabel(f.year_group)}</td>
                  <td className="px-4 py-2">{formatCedis(f.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-base font-semibold">Set / update a fee</h2>
      <FeeStructureForm
        years={years.map((y) => ({ id: y.id, name: y.name }))}
      />
    </section>
  );
}
