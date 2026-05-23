"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/attendance", label: "Class register" },
  { href: "/attendance/boarding", label: "Boarding roll" },
  { href: "/attendance/exeat", label: "Exeat" },
];

export function AttendanceNav() {
  const pathname = usePathname();
  return (
    <nav className="border-navy/10 mt-3 flex gap-1 border-b text-sm">
      {ITEMS.map((it) => {
        const active =
          it.href === "/attendance"
            ? pathname === "/attendance"
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
