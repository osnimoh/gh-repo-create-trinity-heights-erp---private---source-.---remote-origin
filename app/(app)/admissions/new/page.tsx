import Link from "next/link";
import { listAcademicYears } from "@/lib/db/admissions";
import { NewApplicationForm } from "./new-application-form";

export default async function NewApplicationPage() {
  const years = await listAcademicYears();

  return (
    <section className="mx-auto max-w-2xl">
      <Link href="/admissions" className="text-maroon text-sm hover:underline">
        ← Admissions
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">New application</h1>
      <p className="text-muted mt-1 mb-6">
        One-gate admissions — entrance exam only. Creates the applicant and a
        submitted application.
      </p>
      <NewApplicationForm years={years} />
    </section>
  );
}
