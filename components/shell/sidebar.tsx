"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="bg-navy hidden w-60 shrink-0 flex-col text-white md:flex">
      <div className="border-b border-white/10 p-5">
        <p className="font-serif text-lg">Trinity Heights</p>
        <p className="text-xs text-white/60">School ERP</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-maroon text-white"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="text-gold p-4 text-xs tracking-wide">
        Knowledge. Character. Country.
      </p>
    </aside>
  );
}
