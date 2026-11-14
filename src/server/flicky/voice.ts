// Speech-to-text via Groq Whisper, text-to-speech via the Kokoro service (TTS_URL).

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";
// Biases Whisper toward words learners say in our workspaces.
const VOCAB = "1ry-space, idempotency, Idempotency-Key, handler, payment, API, Python, JavaScript, Figma, gradient, radius, contrast, sprint, backlog, P0, story points, stakeholder.";

export class VoiceError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export const hasStt = () => Boolean(process.env.GROQ_API_KEY);
export const hasTts = () => Boolean(process.env.TTS_URL);

export async function transcribe(audio: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", GROQ_MODEL);
  form.append("response_format", "json");
  form.append("temperature", "0");
  form.append("prompt", VOCAB);
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(20_000),
  }).catch((e: unknown) => {
    throw new VoiceError(`Speech recognition didn't answer: ${e instanceof Error ? e.message : e}`, 502);
  });
  if (res.status === 429) throw new VoiceError("Speech recognition is busy. Try again in a few seconds, or type your question.", 503);
  const body = (await res.json().catch(() => null)) as { text?: string; error?: { message?: string } } | null;
  if (!res.ok || typeof body?.text !== "string") {
    throw new VoiceError(`Speech recognition failed (${res.status}): ${body?.error?.message ?? "no text"}`, 502);
  }
  return body.text.trim();
}

/** WAV audio from the Kokoro service. */
export async function speak(text: string, voice?: string): Promise<ArrayBuffer> {
  const res = await fetch(`${process.env.TTS_URL}/speak`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, voice }),
    signal: AbortSignal.timeout(15_000),
  }).catch((e: unknown) => {
    throw new VoiceError(`Text-to-speech didn't answer: ${e instanceof Error ? e.message : e}`, 503);
  });
  if (res.status === 400) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new VoiceError(body?.error ?? "Text-to-speech rejected the request.", 400);
  }
  if (!res.ok) throw new VoiceError(`Text-to-speech failed (${res.status}).`, 503);
  return res.arrayBuffer();
}
