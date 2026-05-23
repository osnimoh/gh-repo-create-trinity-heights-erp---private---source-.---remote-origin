"use client";

import { useSyncExternalStore } from "react";

// Tracks connectivity via the browser online/offline events. Outages are normal,
// not errors — the UI uses this to switch between live reads and the offline
// cache, and to show a banner. useSyncExternalStore keeps it SSR-safe.

function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine, // client snapshot
    () => true, // server snapshot (assume online during SSR)
  );
}
