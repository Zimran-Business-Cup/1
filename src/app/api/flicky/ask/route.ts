import { AskRequestSchema } from "@/contracts/flicky";
import { allow } from "@/lib/rate-limit";
import { stubAskStream } from "@/server/flicky/stub";
import { clientIp, errorJson, readJson } from "@/server/http";

export const maxDuration = 60;

// POST /api/flicky/ask  AskRequest → text/event-stream of AskEvent
// (src/contracts/flicky.ts): `chunk` events with raw text, then `done` with
// the clean text, the walkthrough and [TYPE] requests.
// Stub: streams a recorded answer for the request's workspace.
export async function POST(request: Request) {
  if (!allow(`flicky:${clientIp(request)}`)) return errorJson(429, "Too many questions in a minute. Wait a moment and ask again.");
  const body = await readJson(request, AskRequestSchema);
  if (!body.ok) return body.response;

  return new Response(stubAskStream(body.data, request.signal), {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
