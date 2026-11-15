// Minimal in-memory limiter: by default 20 requests per key per minute.
// Per server instance only; swap for Upstash/Redis when it matters.
const WINDOW_MS = 60_000;
const LIMIT = 20;
const hits = new Map<string, number[]>();

export function allow(key: string, limit = LIMIT): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
