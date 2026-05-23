"use client";

import { useEffect, useState } from "react";
import { getOfflineDb } from "@/lib/offline/db";
import { replayQueue } from "@/lib/offline/queue";
import { createSupabasePush } from "@/lib/offline/sync";
import { useOnlineStatus } from "@/lib/offline/use-online";
import { createClient } from "@/lib/supabase/client";

// Registers the service worker and replays the offline mutation queue whenever
// connectivity returns. Renders a small offline banner.
export function SyncProvider() {
  const online = useOnlineStatus();
  const [pendingNote, setPendingNote] = useState<string | null>(null);

  // Register the PWA service worker once.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW registration is best-effort */
      });
    }
  }, []);

  // Replay the queue on reconnect.
  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    (async () => {
      const db = getOfflineDb();
      const push = createSupabasePush(createClient());
      const summary = await replayQueue(db, push);
      if (!cancelled && summary.failed > 0) {
        setPendingNote(
          `${summary.failed} change(s) need attention after syncing.`,
        );
      } else if (!cancelled) {
        setPendingNote(null);
      }
    })().catch(() => {
      /* offline DB unavailable (e.g. private mode) — ignore */
    });
    return () => {
      cancelled = true;
    };
  }, [online]);

  if (online && !pendingNote) return null;

  return (
    <div
      role="status"
      className={`fixed inset-x-0 bottom-0 z-50 px-4 py-2 text-center text-sm ${
        online ? "bg-gold/20 text-navy" : "bg-navy text-white"
      }`}
    >
      {online
        ? pendingNote
        : "You are offline — changes will sync when you reconnect."}
    </div>
  );
}
