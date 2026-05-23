import type { AppRole } from "@/lib/auth/roles";

export type NavItem = {
  label: string;
  href: string;
  // Roles that see this module in the nav. "all" = every signed-in user.
  // Visibility is UI convenience only — RLS is the real boundary.
  roles: AppRole[] | "all";
};

export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/", roles: "all" },
  { label: "Parent Portal", href: "/portal", roles: ["parent"] },
  { label: "Admissions", href: "/admissions", roles: ["admin", "admissions"] },
  {
    label: "Students",
    href: "/students",
    roles: [
      "admin",
      "admissions",
      "teacher",
      "form_teacher",
      "house_staff",
      "nurse",
      "dsl",
      "bursary",
    ],
  },
  {
    label: "Attendance",
    href: "/attendance",
    roles: ["admin", "teacher", "form_teacher", "house_staff"],
  },
  { label: "Fees", href: "/fees", roles: ["admin", "bursary"] },
  {
    label: "Academics",
    href: "/academics",
    roles: ["admin", "teacher", "form_teacher"],
  },
  {
    label: "Health & Welfare",
    href: "/health",
    roles: ["admin", "nurse", "dsl"],
  },
  {
    label: "Communication",
    href: "/comms",
    roles: [
      "admin",
      "teacher",
      "form_teacher",
      "house_staff",
      "admissions",
      "bursary",
      "nurse",
      "dsl",
    ],
  },
  { label: "Exports", href: "/exports", roles: ["admin"] },
  { label: "Settings", href: "/settings", roles: ["admin"] },
];

export function visibleNav(roles: AppRole[]): NavItem[] {
  return NAV.filter(
    (item) => item.roles === "all" || item.roles.some((r) => roles.includes(r)),
  );
}
