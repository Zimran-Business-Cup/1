import { NextResponse } from "next/server";
import type { TranscribeResponse } from "@/contracts/flicky";
import { allow } from "@/lib/rate-limit";
import { clientIp, errorJson } from "@/server/http";

const MAX_BYTES = 25 * 1024 * 1024; // Groq's free-tier upload limit

// POST /api/flicky/transcribe  multipart/form-data with `audio` → TranscribeResponse.
// Stub: checks the upload and returns a fixed question. Groq Whisper replaces it.
export async function POST(request: Request) {
  if (!allow(`stt:${clientIp(request)}`)) return errorJson(429, "Too many recordings in a minute.");

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob)) return errorJson(400, "Send the recording as multipart/form-data in a field named `audio`.");
  if (audio.size === 0) return errorJson(400, "The recording is empty.");
  if (audio.size > MAX_BYTES) return errorJson(413, "The recording is larger than 25 MB.");

  const result: TranscribeResponse = { text: "How do I do this step?" };
  return NextResponse.json(result);
}
