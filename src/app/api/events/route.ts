import { EventSchema } from "@/contracts/events";
import { allow } from "@/lib/rate-limit";
import { clientIp, errorJson, readJson } from "@/server/http";
import { userId } from "@/server/identity";
import { recordEvent } from "@/server/metrics/events";

// POST /api/events  AppEvent → 204 (src/contracts/events.ts).
export async function POST(request: Request) {
  if (!allow(`events:${clientIp(request)}`)) return errorJson(429, "Too many events in a minute.");
  const body = await readJson(request, EventSchema);
  if (!body.ok) return body.response;
  await recordEvent(await userId(), body.data);
  return new Response(null, { status: 204 });
}
