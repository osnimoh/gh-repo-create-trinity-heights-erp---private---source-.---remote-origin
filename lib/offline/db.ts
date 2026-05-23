import Dexie, { type Table } from "dexie";

// Offline-first store (IndexedDB via Dexie). Treat network outages as normal:
// reads are served from `cache`; writes are appended to `sync_queue` and
// replayed on reconnect. Mirrors the Folia mutation-queue architecture.

// Conflict policy per mutation:
//  - "lww"            read-mostly data; last write wins, safe to retry.
//  - "server_confirm" money/results/safeguarding; NEVER assume success — the
//                     row is only authoritative once the server accepts it.
export type ConflictPolicy = "lww" | "server_confirm";

export type MutationOp = "insert" | "update" | "delete" | "rpc";
export type MutationStatus = "pending" | "done" | "failed";

export interface QueuedMutation {
  id?: number;
  // For table ops: the table name. For rpc: the function name.
  target: string;
  op: MutationOp;
  payload: unknown;
  policy: ConflictPolicy;
  status: MutationStatus;
  attempts: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CacheEntry {
  key: string;
  value: unknown;
  cachedAt: number;
}

export class TrinityOfflineDB extends Dexie {
  sync_queue!: Table<QueuedMutation, number>;
  cache!: Table<CacheEntry, string>;

  constructor(name = "trinity-offline") {
    super(name);
    this.version(1).stores({
      // ++id auto-increment preserves FIFO replay order; status indexed.
      sync_queue: "++id, status, createdAt",
      cache: "key, cachedAt",
    });
  }
}

let _db: TrinityOfflineDB | null = null;

export function getOfflineDb(): TrinityOfflineDB {
  if (!_db) _db = new TrinityOfflineDB();
  return _db;
}
