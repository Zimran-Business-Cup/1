import Anthropic from "@anthropic-ai/sdk";
import { parseFlickyAnswer, type AskEvent, type AskRequest } from "@/contracts/flicky";
import { getPublicTask } from "@/server/tasks/store";
import { FLICKY_SYSTEM, contextText } from "./prompt";

// POST /api/flicky/ask with a real model: the Flicky prompt, an image of the
// workspace, its anchors and the task, streamed back as SSE `chunk` events.
// The `done` event carries the clean text and the walkthrough, with steps to
// unknown anchors dropped.

const MODEL = "claude-opus-5-5";
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export const hasModel = () => client !== null;

const sse = (event: AskEvent) => `data: ${JSON.stringify(event)}\n\n`;

type Msg = Anthropic.Beta.BetaMessageParam;

/** The API wants a user turn first and alternating roles; merge or drop the rest. */
function normalizeHistory(history: AskRequest["history"]): Msg[] {
  const out: Msg[] = [];
  for (const m of history) {
    if (!out.length && m.role !== "user") continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role && typeof last.content === "string") last.content += `\n\n${m.content}`;
    else out.push({ role: m.role, content: m.content });
  }
  // The new question is a user turn, so the history must end with the assistant.
  if (out.length && out[out.length - 1].role === "user") out.pop();
  return out;
}

export function modelAskStream(req: AskRequest, signal: AbortSignal): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const task = req.taskId ? getPublicTask(req.taskId) : null;
  const known = new Set(req.anchors.map((a) => a.id));
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (req.snapshot) {
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: req.snapshot.data } });
  }
  content.push({
    type: "text",
    text: contextText(req.question, req.anchors, task, req.snapshot ? { width: req.snapshot.width, height: req.snapshot.height } : null),
  });

  return new ReadableStream({
    async start(controller) {
      const send = (event: AskEvent) => controller.enqueue(encoder.encode(sse(event)));
      let raw = "";
      try {
        const stream = client!.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: 4000,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            // Byte-stable system prompt: cached across every question.
            system: [{ type: "text", text: FLICKY_SYSTEM, cache_control: { type: "ephemeral" } }],
            output_config: { effort: "low" },
            messages: [...normalizeHistory(req.history), { role: "user", content }],
          },
          { signal },
        );
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            raw += event.delta.text;
            send({ type: "chunk", text: event.delta.text });
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          send({ type: "error", message: "I can't help with that one. Try asking about the task." });
        } else {
          send({ type: "done", ...parseFlickyAnswer(raw, known) });
        }
      } catch (error) {
        if (signal.aborted) return controller.close();
        const message =
          error instanceof Anthropic.RateLimitError
            ? "I'm busy right now. Ask again in a few seconds."
            : error instanceof Anthropic.APIError
              ? `The AI service returned an error (${error.status}). Ask again.`
              : "Something went wrong. Ask again.";
        console.error("[flicky] ask failed:", error instanceof Error ? error.message : error);
        send({ type: "error", message });
      }
      controller.close();
    },
  });
}
