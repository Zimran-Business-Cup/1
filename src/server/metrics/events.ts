import type { AppEvent } from "@/contracts/events";

// In-memory event log until Postgres is wired in. Bounded so a long-running
// dev server doesn't grow forever.
const MAX = 5000;
const log: (AppEvent & { at: number })[] = [];

export function recordEvent(event: AppEvent) {
  log.push({ ...event, at: Date.now() });
  if (log.length > MAX) log.splice(0, log.length - MAX);
}

export function eventsFor(sessionId: string) {
  return log.filter((e) => e.sessionId === sessionId);
}
