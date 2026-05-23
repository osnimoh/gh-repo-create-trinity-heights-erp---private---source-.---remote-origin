import { listHouses } from "@/lib/db/admissions";
import { getHouseRoster } from "@/lib/db/boarding";
import { BoardingForm } from "./boarding-form";
import { AttendanceNav } from "../nav";
import { BOARDING_SESSIONS } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";

type BoardingSession = Database["public"]["Enums"]["boarding_session"];

export default async function BoardingPage({
  searchParams,
}: {
  searchParams: Promise<{
    house_id?: string;
    date?: string;
    session?: string;
  }>;
}) {
  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = sp.date || today;
  const session: BoardingSession =
    sp.session === "morning" ? "morning" : "evening";

  const houses = await listHouses();
  const houseId = sp.house_id;
  const roster = houseId ? await getHouseRoster(houseId, date, session) : [];

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Attendance</h1>
      <AttendanceNav />

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">House</span>
          <select
            name="house_id"
            defaultValue={houseId ?? ""}
            className="border-navy/20 rounded-md border px-3 py-2"
          >
            <option value="">Choose…</option>
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="border-navy/20 rounded-md border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-navy font-medium">Session</span>
          <select
            name="session"
            defaultValue={session}
            className="border-navy/20 rounded-md border px-3 py-2"
          >
            {BOARDING_SESSIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-navy rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Load roll
        </button>
      </form>

      {houseId ? (
        <BoardingForm
          roster={roster}
          houseId={houseId}
          date={date}
          session={session}
        />
      ) : (
        <p className="text-muted mt-4">Choose a house to take the roll.</p>
      )}
    </section>
  );
}
