"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/fees", label: "Dashboard" },
  { href: "/fees/generate", label: "Generate invoice" },
  { href: "/fees/scholarships", label: "Scholarships" },
  { href: "/fees/structures", label: "Fee structure" },
];

export function FeesNav() {
  const pathname = usePathname();
  return (
    <nav className="border-navy/10 mt-3 flex flex-wrap gap-1 border-b text-sm">
      {ITEMS.map((it) => {
        const active =
          it.href === "/fees"
            ? pathname === "/fees"
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
