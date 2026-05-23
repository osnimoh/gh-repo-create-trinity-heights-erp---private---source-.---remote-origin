import { type TrinityOfflineDB } from "./db";

// Read-mostly data (students, classes, timetables…) is cached aggressively so
// the app stays useful offline. Money/results/safeguarding are NOT cached here
// — they require a live, RLS-checked read.

export async function putCache(
  db: TrinityOfflineDB,
  key: string,
  value: unknown,
): Promise<void> {
  await db.cache.put({ key, value, cachedAt: Date.now() });
}

export async function getCache<T>(
  db: TrinityOfflineDB,
  key: string,
  maxAgeMs?: number,
): Promise<T | undefined> {
  const entry = await db.cache.get(key);
  if (!entry) return undefined;
  if (maxAgeMs && Date.now() - entry.cachedAt > maxAgeMs) return undefined;
  return entry.value as T;
}

export async function clearCache(db: TrinityOfflineDB): Promise<void> {
  await db.cache.clear();
}
