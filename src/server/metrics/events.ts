import type { AppEvent } from "@/contracts/events";
import { saveEvent } from "@/server/db/repo";

// Events go to Postgres. Without a database (plain `npm run dev`) they are kept
// in a bounded in-memory log instead.
const MAX = 5000;
const memory: (AppEvent & { userId: string; at: number })[] = [];

export async function recordEvent(userId: string, event: AppEvent) {
  if (await saveEvent(userId, event)) return;
  memory.push({ ...event, userId, at: Date.now() });
  if (memory.length > MAX) memory.splice(0, memory.length - MAX);
}
