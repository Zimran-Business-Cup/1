import { parseFlickyAnswer, type AskEvent, type AskRequest } from "@/contracts/flicky";
import { AiError, aiProvider, streamText, type ChatMessage } from "@/server/ai";
import { getPublicTask } from "@/server/tasks/store";
import { FLICKY_SYSTEM, contextText } from "./prompt";

export const hasModel = () => aiProvider !== null;

const sse = (event: AskEvent) => `data: ${JSON.stringify(event)}\n\n`;

const SPOKEN_ERRORS: Partial<Record<AiError["kind"], string>> = {
  busy: "I'm busy right now. Ask again in a few seconds.",
  refused: "I can't help with that one. Try asking about the task.",
};

/** Models want a user turn first and alternating roles; merge or drop the rest. */
function normalizeHistory(history: AskRequest["history"]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of history) {
    if (!out.length && m.role !== "user") continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += `\n\n${m.content}`;
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
  const size = req.snapshot ? { width: req.snapshot.width, height: req.snapshot.height } : null;

  return new ReadableStream({
    async start(controller) {
      const send = (event: AskEvent) => controller.enqueue(encoder.encode(sse(event)));
      let raw = "";
      try {
        const deltas = streamText(
          {
            system: FLICKY_SYSTEM,
            history: normalizeHistory(req.history),
            question: { text: contextText(req.question, req.anchors, task, size, req.focus), jpegBase64: req.snapshot?.data },
          },
          signal,
        );
        for await (const text of deltas) {
          raw += text;
          send({ type: "chunk", text });
        }
        send({ type: "done", ...parseFlickyAnswer(raw, known, { pixels: !!size }) });
      } catch (error) {
        if (signal.aborted) return controller.close();
        console.error("[flicky] ask failed:", error instanceof Error ? error.message : error);
        const message = (error instanceof AiError && SPOKEN_ERRORS[error.kind]) || "Something went wrong. Ask again.";
        send({ type: "error", message });
      }
      controller.close();
    },
  });
}
