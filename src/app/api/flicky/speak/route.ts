import { SpeakRequestSchema } from "@/contracts/flicky";
import { errorJson, readJson } from "@/server/http";

// POST /api/flicky/speak  SpeakRequest → audio/wav (Kokoro-82M).
// Stub: Kokoro isn't running yet, so it answers 503 with `X-Fallback: browser`
// and the bridge speaks with the browser's speechSynthesis instead.
export async function POST(request: Request) {
  const body = await readJson(request, SpeakRequestSchema);
  if (!body.ok) return body.response;
  return errorJson(503, "Text-to-speech isn't running yet. Use the browser voice.", { "X-Fallback": "browser" });
}
