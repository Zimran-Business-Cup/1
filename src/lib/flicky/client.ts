"use client";

import { AskEventSchema, TranscribeResponseSchema, type AskEvent, type AskRequest } from "@/contracts/flicky";

// Calls to the Flicky routes: speech to text, the streamed answer, and the voice.

export class FlickyError extends Error {}

async function errorText(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? fallback;
}

/** POST /api/flicky/transcribe: a WAV recording → the question as text. */
export async function transcribe(wav: Blob, signal?: AbortSignal): Promise<string> {
  const form = new FormData();
  form.append("audio", wav, "question.wav");
  let res: Response;
  try {
    res = await fetch("/api/flicky/transcribe", { method: "POST", body: form, signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new FlickyError("You seem to be offline. Check your connection and try again.");
  }
  if (!res.ok) throw new FlickyError(await errorText(res, "I couldn't hear that. Try again."));
  return TranscribeResponseSchema.parse(await res.json()).text.trim();
}

/** POST /api/flicky/ask: streams AskEvents (server-sent events) to `onEvent`. */
export async function ask(request: AskRequest, onEvent: (event: AskEvent) => void, signal: AbortSignal): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/flicky/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new FlickyError("You seem to be offline. Check your connection and try again.");
  }
  if (!res.ok || !res.body) throw new FlickyError(await errorText(res, "Space couldn't answer right now. Try again."));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let end: number;
    while ((end = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const data = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) continue;
      const parsed = AskEventSchema.safeParse(JSON.parse(data));
      if (parsed.success) onEvent(parsed.data);
    }
  }
}

// Kokoro on our server synthesizes at about the speed of speech (1.5 s for a short
// clause), so answers go out in short chunks: the first plays after ~2 s and each
// next chunk is synthesized while the previous one plays. The browser voice covers
// a chunk when the server voice fails, and the rest of the answer after two failures in a row.
const FIRST_CHUNK = 50;
const MAX_CHUNK = 90;
const MAX_FAILURES = 2;
const voiceTimeout = (chunk: string) => Math.min(15_000, 2_500 + chunk.length * 70);

/** Sentences, with long ones split after commas, semicolons, colons and dashes. */
export function speechChunks(text: string): string[] {
  const chunks: string[] = [];
  for (const raw of text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? []) {
    const sentence = raw.trim();
    if (!sentence) continue;
    let current = "";
    for (const part of sentence.split(/(?<=[,;:—–])\s+/)) {
      const limit = chunks.length ? MAX_CHUNK : FIRST_CHUNK;
      if (current && current.length + part.length + 1 > limit) {
        chunks.push(current);
        current = part;
      } else {
        current = current ? `${current} ${part}` : part;
      }
    }
    if (current) chunks.push(current);
  }
  return chunks;
}

export interface Speaker {
  speak(text: string): Promise<void>;
  stop(): void;
}

export function createSpeaker(): Speaker {
  let run = 0;
  let audio: HTMLAudioElement | null = null;
  let failures = 0;

  async function fetchVoice(chunk: string): Promise<Blob | null> {
    if (failures >= MAX_FAILURES) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), voiceTimeout(chunk));
    try {
      const res = await fetch("/api/flicky/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk.slice(0, 1500) }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`speak ${res.status}`);
      const blob = await res.blob();
      failures = 0;
      return blob;
    } catch {
      failures++;
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  const play = (blob: Blob, mine: number) =>
    new Promise<void>((resolve) => {
      if (mine !== run) return resolve();
      const url = URL.createObjectURL(blob);
      audio = new Audio(url);
      const done = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onended = done;
      audio.onerror = done;
      audio.play().catch(done);
    });

  const sayInBrowser = (sentence: string, mine: number) =>
    new Promise<void>((resolve) => {
      if (mine !== run || typeof speechSynthesis === "undefined") return resolve();
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 1.04;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      speechSynthesis.speak(utterance);
    });

  return {
    async speak(text: string) {
      const mine = ++run;
      failures = 0;
      const parts = speechChunks(text);
      let next = parts.length ? fetchVoice(parts[0]) : null;
      for (let i = 0; i < parts.length && mine === run; i++) {
        const blob = await next;
        // Synthesize the next chunk while this one plays.
        next = i + 1 < parts.length ? fetchVoice(parts[i + 1]) : null;
        if (mine !== run) break;
        if (blob) await play(blob, mine);
        else await sayInBrowser(parts[i], mine);
      }
    },
    stop() {
      run++;
      audio?.pause();
      audio = null;
      if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    },
  };
}
