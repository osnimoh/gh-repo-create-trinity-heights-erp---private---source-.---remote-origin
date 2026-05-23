import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { TrinityOfflineDB } from "@/lib/offline/db";
import {
  enqueueMutation,
  failedMutations,
  pendingMutations,
  replayQueue,
  retryMutation,
} from "@/lib/offline/queue";

let db: TrinityOfflineDB;

beforeEach(async () => {
  // Fresh DB per test for isolation.
  db = new TrinityOfflineDB(`test-${Math.random().toString(36).slice(2)}`);
  await db.open();
});

describe("offline mutation queue", () => {
  it("enqueues and replays FIFO; all succeed when the server accepts", async () => {
    await enqueueMutation(db, {
      target: "attendance_mark",
      op: "insert",
      payload: { a: 1 },
      policy: "lww",
    });
    await enqueueMutation(db, {
      target: "attendance_mark",
      op: "insert",
      payload: { a: 2 },
      policy: "lww",
    });

    const order: unknown[] = [];
    const summary = await replayQueue(db, async (m) => {
      order.push((m.payload as { a: number }).a);
    });

    expect(summary).toEqual({ done: 2, failed: 0, remaining: 0 });
    expect(order).toEqual([1, 2]); // FIFO
    expect(await pendingMutations(db)).toHaveLength(0);
  });

  it("keeps a server_confirm mutation as FAILED (never dropped) on rejection", async () => {
    await enqueueMutation(db, {
      target: "payment",
      op: "rpc",
      payload: { args: { amount: 100 } },
      policy: "server_confirm",
    });

    const summary = await replayQueue(db, async () => {
      throw new Error("RLS: not authorized");
    });

    expect(summary.failed).toBe(1);
    const failed = await failedMutations(db);
    expect(failed).toHaveLength(1);
    expect(failed[0].error).toMatch(/not authorized/);
    expect(failed[0].attempts).toBe(1); // server_confirm fails fast
  });

  it("retries an lww mutation, then marks it failed after the cap", async () => {
    await enqueueMutation(db, {
      target: "timetable",
      op: "insert",
      payload: {},
      policy: "lww",
    });

    // Always rejects. lww stays pending and retries up to the cap (5).
    for (let i = 0; i < 4; i++) {
      const s = await replayQueue(db, async () => {
        throw new Error("temporary");
      });
      expect(s.failed).toBe(0);
      expect(s.remaining).toBe(1);
    }
    const fifth = await replayQueue(db, async () => {
      throw new Error("temporary");
    });
    expect(fifth.failed).toBe(1);
    expect(fifth.remaining).toBe(0);
    expect(await failedMutations(db)).toHaveLength(1);
  });

  it("can re-queue a failed mutation for another attempt", async () => {
    const id = await enqueueMutation(db, {
      target: "payment",
      op: "rpc",
      payload: { args: {} },
      policy: "server_confirm",
    });
    await replayQueue(db, async () => {
      throw new Error("rejected");
    });
    expect(await failedMutations(db)).toHaveLength(1);

    await retryMutation(db, id);
    const summary = await replayQueue(db, async () => {
      /* now succeeds */
    });
    expect(summary.done).toBe(1);
    expect(await failedMutations(db)).toHaveLength(0);
  });
});
