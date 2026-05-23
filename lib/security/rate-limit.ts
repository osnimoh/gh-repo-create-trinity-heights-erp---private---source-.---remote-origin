// Rate limiting behind an interface. The in-memory limiter is for single-
// instance/dev use ONLY — it does not share state across serverless instances.
// In production, back this with a shared store (e.g. Upstash Redis) implementing
// the same interface, and apply it to sensitive actions (login, payment,
// safeguarding reads).

export interface RateLimiter {
  check(key: string): Promise<{ allowed: boolean; remaining: number }>;
}

export function createInMemoryRateLimiter(
  limit: number,
  windowMs: number,
): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    async check(key: string) {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || now > entry.resetAt) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1 };
      }
      entry.count += 1;
      const allowed = entry.count <= limit;
      return { allowed, remaining: Math.max(0, limit - entry.count) };
    },
  };
}
