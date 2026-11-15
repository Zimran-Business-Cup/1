import { SpeakRequestSchema } from "@/contracts/flicky";
import { allow } from "@/lib/rate-limit";
import { hasTts, speak, VoiceError } from "@/server/flicky/voice";
import { clientIp, errorJson, readJson } from "@/server/http";

// POST /api/flicky/speak  SpeakRequest → audio/wav.
// 503 with X-Fallback: browser tells the client to use speechSynthesis instead.
// Answers are spoken in short chunks, and a room of people can share one IP.
const SPEAK_LIMIT = 150;

export async function POST(request: Request) {
  if (!allow(`tts:${clientIp(request)}`, SPEAK_LIMIT)) return errorJson(429, "Too many voice requests in a minute.", { "X-Fallback": "browser" });
  const body = await readJson(request, SpeakRequestSchema);
  if (!body.ok) return body.response;

  if (!hasTts()) return errorJson(503, "Text-to-speech isn't running. Use the browser voice.", { "X-Fallback": "browser" });
  try {
    const wav = await speak(body.data.text, body.data.voice);
    return new Response(wav, { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof VoiceError) {
      if (error.status === 400) return errorJson(400, error.message);
      console.error("[flicky] speak:", error.message);
      return errorJson(503, "Text-to-speech isn't available right now. Use the browser voice.", { "X-Fallback": "browser" });
    }
    throw error;
  }
}
