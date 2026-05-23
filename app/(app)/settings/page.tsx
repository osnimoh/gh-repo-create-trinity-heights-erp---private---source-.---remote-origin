import Link from "next/link";
import { SettingsNav } from "./nav";

const TOOLS = [
  {
    href: "/settings/roles",
    title: "Roles",
    blurb: "Grant or remove a user's role by email.",
  },
  {
    href: "/settings/house-staff",
    title: "House staff",
    blurb: "Assign house staff to the house(s) they oversee.",
  },
  {
    href: "/settings/subjects",
    title: "Class subjects",
    blurb: "Assign subjects (and teachers) to classes.",
  },
];

export default function SettingsPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <SettingsNav />
      <p className="text-muted mt-4">
        Administrator tools. Changes here drive access control (roles) and the
        scoping of attendance, boarding, and academics.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="border-navy/10 hover:border-maroon rounded-lg border bg-white p-4"
          >
            <h2 className="text-navy font-medium">{t.title}</h2>
            <p className="text-muted mt-1 text-sm">{t.blurb}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
