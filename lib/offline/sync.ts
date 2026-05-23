import type { SupabaseClient } from "@supabase/supabase-js";
import { type QueuedMutation } from "./db";
import { type PushFn } from "./queue";

// Maps a queued mutation onto a real Supabase call. Used by the SyncProvider to
// replay the offline queue on reconnect. Throws on rejection so replayQueue can
// mark the item failed/pending per its conflict policy.
export function createSupabasePush(supabase: SupabaseClient): PushFn {
  return async (mut: QueuedMutation) => {
    let error: { message: string } | null = null;

    if (mut.op === "rpc") {
      const { payload } = mut as { payload: { args?: unknown } };
      ({ error } = await supabase.rpc(
        mut.target,
        (payload?.args ?? {}) as never,
      ));
    } else if (mut.op === "insert") {
      ({ error } = await supabase
        .from(mut.target)
        .insert(mut.payload as never));
    } else if (mut.op === "update") {
      const { match, values } = mut.payload as {
        match: Record<string, unknown>;
        values: Record<string, unknown>;
      };
      ({ error } = await supabase
        .from(mut.target)
        .update(values as never)
        .match(match));
    } else if (mut.op === "delete") {
      const { match } = mut.payload as { match: Record<string, unknown> };
      ({ error } = await supabase.from(mut.target).delete().match(match));
    }

    if (error) throw new Error(error.message);
  };
}
