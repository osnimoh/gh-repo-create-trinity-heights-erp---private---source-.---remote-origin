import { getCurrentRoles } from "@/lib/auth/session";
import { listMessages, myAcknowledgedIds } from "@/lib/db/comms";
import { listClasses } from "@/lib/db/admissions";
import { ComposeForm } from "./compose-form";
import { acknowledgeMessage } from "./actions";

const AUDIENCE_LABELS: Record<string, string> = {
  all_parents: "All parents",
  all_staff: "All staff",
  class: "Class",
  individual: "Direct",
};

export default async function CommsPage() {
  const roles = await getCurrentRoles();
  const isStaff = roles.some((r) => r !== "parent");

  const [messages, acked, classes] = await Promise.all([
    listMessages(),
    myAcknowledgedIds(),
    isStaff ? listClasses() : Promise.resolve([]),
  ]);

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Communication</h1>

      {isStaff ? (
        <div className="border-navy/10 mt-4 rounded-lg border bg-white p-4">
          <h2 className="text-base font-semibold">Compose</h2>
          <div className="mt-3">
            <ComposeForm classes={classes} />
          </div>
        </div>
      ) : null}

      <h2 className="mt-8 text-base font-semibold">Messages</h2>
      <div className="mt-2 space-y-3">
        {messages.length === 0 ? (
          <p className="text-muted">No messages.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className="border-navy/10 rounded-lg border bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-navy font-medium">{m.subject}</h3>
                <span className="bg-cream text-navy rounded-full px-2 py-0.5 text-xs">
                  {AUDIENCE_LABELS[m.audience] ?? m.audience}
                </span>
              </div>
              <p className="text-foreground mt-2 text-sm whitespace-pre-wrap">
                {m.body}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-muted text-xs">
                  {new Date(m.created_at).toLocaleString()}
                </span>
                {acked.has(m.id) ? (
                  <span className="text-gold text-xs">Acknowledged</span>
                ) : (
                  <form action={acknowledgeMessage}>
                    <input type="hidden" name="message_id" value={m.id} />
                    <button
                      type="submit"
                      className="border-navy/20 hover:bg-cream rounded-md border px-3 py-1 text-xs"
                    >
                      Acknowledge
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
