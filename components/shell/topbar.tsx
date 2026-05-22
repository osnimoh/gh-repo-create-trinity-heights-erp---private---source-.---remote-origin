import { signOut } from "@/app/(auth)/login/actions";
import { roleLabel, type AppRole } from "@/lib/auth/roles";

export function Topbar({ email, roles }: { email: string; roles: AppRole[] }) {
  return (
    <header className="border-navy/10 flex items-center justify-between gap-4 border-b bg-white px-6 py-3">
      <div className="flex flex-wrap items-center gap-1">
        {roles.length > 0 ? (
          roles.map((r) => (
            <span
              key={r}
              className="bg-cream text-navy rounded-full px-2 py-0.5 text-xs font-medium"
            >
              {roleLabel(r)}
            </span>
          ))
        ) : (
          <span className="text-maroon text-xs">No role assigned</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted hidden text-sm sm:inline">{email}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="border-navy/20 hover:bg-cream rounded-md border px-3 py-1.5 text-sm transition"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
