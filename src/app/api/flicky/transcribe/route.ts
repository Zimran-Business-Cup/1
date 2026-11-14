import { NextResponse } from "next/server";
import type { TranscribeResponse } from "@/contracts/flicky";
import { allow } from "@/lib/rate-limit";
import { hasStt, transcribe, VoiceError } from "@/server/flicky/voice";
import { clientIp, errorJson } from "@/server/http";

const MAX_BYTES = 25 * 1024 * 1024; // Groq's free-tier upload limit

// POST /api/flicky/transcribe  multipart `audio` → TranscribeResponse.
// Without GROQ_API_KEY it returns a fixed question (X-Flicky-Mode: demo).
export async function POST(request: Request) {
  if (!allow(`stt:${clientIp(request)}`)) return errorJson(429, "Too many recordings in a minute.");

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob)) return errorJson(400, "Send the recording as multipart/form-data in a field named `audio`.");
  if (audio.size === 0) return errorJson(400, "The recording is empty.");
  if (audio.size > MAX_BYTES) return errorJson(413, "The recording is larger than 25 MB.");

  if (!hasStt()) {
    const result: TranscribeResponse = { text: "How do I do this step?" };
    return NextResponse.json(result, { headers: { "X-Flicky-Mode": "demo" } });
  }
  try {
    const name = audio instanceof File && audio.name ? audio.name : "question.webm";
    const result: TranscribeResponse = { text: await transcribe(audio, name) };
    return NextResponse.json(result, { headers: { "X-Flicky-Mode": "ai" } });
  } catch (error) {
    if (error instanceof VoiceError) {
      console.error("[flicky] transcribe:", error.message);
      return errorJson(error.status, error.status === 503 ? error.message : "Couldn't understand the recording. Try again or type your question.");
    }
    throw error;
  }
}
