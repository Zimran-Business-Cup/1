import { z } from "zod";
import { AiError, type JsonRequest, type StreamRequest } from "./types";

// OpenRouter's OpenAI-compatible chat completions API, called with fetch.
const URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4.1-flash-1017";
const STT_MODEL = process.env.OPENROUTER_STT_MODEL || "google/gemini-3.5-flash-lite";

type Part =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "input_audio"; input_audio: { data: string; format: string } };

interface Message {
  role: "system" | "user" | "assistant";
  content: string | Part[];
}

interface Choice {
  finish_reason?: string | null;
  message?: { content?: string | null };
  delta?: { content?: string | null };
}

interface Completion {
  choices?: Choice[];
  error?: { code?: number; message?: string };
}

async function post(body: Record<string, unknown>, signal: AbortSignal): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "1ry-space",
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal.aborted && !(signal.reason instanceof DOMException && signal.reason.name === "TimeoutError")) throw error;
    console.error("[openrouter] request failed:", error instanceof Error ? error.message : error);
    throw new AiError("upstream");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as Completion | null;
    throw failure(res.status, body?.error?.message);
  }
  return res;
}

function failure(status: number, message = "no message"): AiError {
  console.error(`[openrouter] ${status}: ${message}`);
  if (status === 429) return new AiError("busy");
  if (status === 401 || status === 403) return new AiError("auth");
  return new AiError("upstream", status);
}

/** Some models wrap JSON in a code fence even in JSON mode. */
function parseJson(text: string | null | undefined): unknown {
  if (!text) return null;
  const unfenced = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  try {
    return JSON.parse(unfenced);
  } catch {
    return null;
  }
}

export async function openRouterJson<S extends z.ZodType>(schema: S, req: JsonRequest): Promise<z.infer<S>> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;
  const res = await post(
    {
      model: MODEL,
      messages: [{ role: "system", content: req.system }, ...req.messages] satisfies Message[],
      response_format: { type: "json_schema", json_schema: { name: req.name, strict: true, schema: jsonSchema } },
      // Route only to providers that enforce the schema.
      provider: { require_parameters: true },
      reasoning: { effort: "low", exclude: true },
      max_tokens: 8000,
    },
    AbortSignal.timeout(55_000),
  );
  const body = (await res.json()) as Completion;
  if (body.error) throw failure(body.error.code ?? 502, body.error.message);
  const choice = body.choices?.[0];
  if (choice?.finish_reason === "content_filter") throw new AiError("refused");
  const parsed = schema.safeParse(parseJson(choice?.message?.content));
  if (!parsed.success) {
    console.error("[openrouter] reply did not match the schema:", parsed.error.issues.slice(0, 3));
    throw new AiError("invalid");
  }
  return parsed.data;
}

export async function* openRouterStream(req: StreamRequest, signal: AbortSignal): AsyncGenerator<string> {
  const content: Part[] = [];
  if (req.question.jpegBase64) content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${req.question.jpegBase64}` } });
  content.push({ type: "text", text: req.question.text });

  const res = await post(
    {
      model: MODEL,
      stream: true,
      messages: [{ role: "system", content: req.system }, ...req.history, { role: "user", content }] satisfies Message[],
      reasoning: { effort: "low", exclude: true },
      max_tokens: 2000,
    },
    signal,
  );

  // Server-sent events: `data: {...}` lines, `: comment` keep-alives, `data: [DONE]` at the end.
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      const chunk = JSON.parse(data) as Completion;
      if (chunk.error) throw failure(chunk.error.code ?? 502, chunk.error.message);
      const choice = chunk.choices?.[0];
      if (choice?.finish_reason === "content_filter") throw new AiError("refused");
      if (choice?.delta?.content) yield choice.delta.content;
    }
  }
}

/** Speech-to-text with an audio-capable chat model. */
export async function openRouterTranscribe(audio: Blob, format: string, vocabulary: string): Promise<string> {
  const data = Buffer.from(await audio.arrayBuffer()).toString("base64");
  const res = await post(
    {
      model: STT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Transcribe this English recording word for word. Reply with the transcript only, without quotes or notes. Terms the speaker may use: ${vocabulary}`,
            },
            { type: "input_audio", input_audio: { data, format } },
          ],
        },
      ] satisfies Message[],
      temperature: 0,
      max_tokens: 600,
    },
    AbortSignal.timeout(20_000),
  );
  const body = (await res.json()) as Completion;
  if (body.error) throw failure(body.error.code ?? 502, body.error.message);
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AiError("invalid");
  return text;
}
