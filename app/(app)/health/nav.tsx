"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HealthNav({ showSafeguarding }: { showSafeguarding: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/health", label: "Health & sick bay" },
    ...(showSafeguarding
      ? [{ href: "/health/safeguarding", label: "Safeguarding" }]
      : []),
  ];
  return (
    <nav className="border-navy/10 mt-3 flex flex-wrap gap-1 border-b text-sm">
      {items.map((it) => {
        const active =
          it.href === "/health"
            ? pathname === "/health"
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
