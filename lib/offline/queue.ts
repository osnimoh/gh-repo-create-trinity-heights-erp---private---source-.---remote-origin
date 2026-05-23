import {
  type ConflictPolicy,
  type MutationOp,
  type QueuedMutation,
  type TrinityOfflineDB,
} from "./db";

const MAX_ATTEMPTS = 5;

export type NewMutation = {
  target: string;
  op: MutationOp;
  payload: unknown;
  policy: ConflictPolicy;
};

/** Append a write to the queue (called instead of hitting the network while offline). */
export async function enqueueMutation(
  db: TrinityOfflineDB,
  mut: NewMutation,
): Promise<number> {
  const now = Date.now();
  return db.sync_queue.add({
    ...mut,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export async function pendingMutations(
  db: TrinityOfflineDB,
): Promise<QueuedMutation[]> {
  // FIFO by insertion order (auto-increment id).
  return db.sync_queue.where("status").equals("pending").sortBy("id");
}

// The caller supplies how to actually push a mutation to the server (Supabase).
// Resolve = accepted; throw = rejected (RLS/constraint/etc.).
export type PushFn = (mut: QueuedMutation) => Promise<void>;

export type ReplaySummary = {
  done: number;
  failed: number;
  remaining: number;
};

/**
 * Replay pending mutations in order. Stops a mutation's progress on first error
 * for that item but continues with the rest. `server_confirm` items that fail
 * are marked `failed` and kept for manual resolution (never silently dropped);
 * `lww` items are retried up to MAX_ATTEMPTS, then marked `failed`.
 */
export async function replayQueue(
  db: TrinityOfflineDB,
  push: PushFn,
): Promise<ReplaySummary> {
  const pending = await pendingMutations(db);
  let done = 0;
  let failed = 0;

  for (const mut of pending) {
    try {
      await push(mut);
      await db.sync_queue.update(mut.id!, {
        status: "done",
        updatedAt: Date.now(),
        attempts: mut.attempts + 1,
      });
      done++;
    } catch (e) {
      const attempts = mut.attempts + 1;
      const message = e instanceof Error ? e.message : String(e);
      // lww may keep retrying; server_confirm fails fast (needs human review).
      const exhausted =
        mut.policy === "server_confirm" || attempts >= MAX_ATTEMPTS;
      await db.sync_queue.update(mut.id!, {
        status: exhausted ? "failed" : "pending",
        attempts,
        error: message,
        updatedAt: Date.now(),
      });
      if (exhausted) failed++;
    }
  }

  const remaining = await db.sync_queue
    .where("status")
    .equals("pending")
    .count();
  return { done, failed, remaining };
}

export async function failedMutations(
  db: TrinityOfflineDB,
): Promise<QueuedMutation[]> {
  return db.sync_queue.where("status").equals("failed").sortBy("id");
}

/** Re-queue a failed mutation for another attempt (e.g. after a conflict is resolved). */
export async function retryMutation(
  db: TrinityOfflineDB,
  id: number,
): Promise<void> {
  await db.sync_queue.update(id, { status: "pending", updatedAt: Date.now() });
}
