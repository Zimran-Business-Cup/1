import { AskRequestSchema } from "@/contracts/flicky";
import { allow } from "@/lib/rate-limit";
import { hasModel, modelAskStream } from "@/server/flicky/ask";
import { stubAskStream } from "@/server/flicky/stub";
import { clientIp, errorJson, readJson } from "@/server/http";
import { userId } from "@/server/identity";

export const maxDuration = 60;

// POST /api/flicky/ask  AskRequest → text/event-stream of AskEvent
// (src/contracts/flicky.ts): `chunk` events with raw text, then `done` with
// the clean text, the walkthrough and [TYPE] requests, or `error`.
// With ANTHROPIC_API_KEY it asks the model; without it, it streams a
// recorded answer (header X-Flicky-Mode tells which).
export async function POST(request: Request) {
  if (!allow(`flicky:${clientIp(request)}`)) return errorJson(429, "Too many questions in a minute. Wait a moment and ask again.");
  const body = await readJson(request, AskRequestSchema);
  if (!body.ok) return body.response;
  await userId(); // set the anonymous id before the stream starts

  const live = hasModel();
  const stream = live ? modelAskStream(body.data, request.signal) : stubAskStream(body.data, request.signal);
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Flicky-Mode": live ? "ai" : "demo",
    },
  });
}
