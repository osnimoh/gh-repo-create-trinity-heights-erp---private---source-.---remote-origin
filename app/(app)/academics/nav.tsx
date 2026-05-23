"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/academics", label: "Results" },
  { href: "/academics/report-cards", label: "Report cards" },
  { href: "/academics/timetable", label: "Timetable" },
];

export function AcademicsNav() {
  const pathname = usePathname();
  return (
    <nav className="border-navy/10 mt-3 flex flex-wrap gap-1 border-b text-sm">
      {ITEMS.map((it) => {
        const active =
          it.href === "/academics"
            ? pathname === "/academics"
            : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`-mb-px border-b-2 px-3 py-2 ${
              active
                ? "border-maroon text-maroon font-medium"
                : "text-muted hover:text-navy border-transparent"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
