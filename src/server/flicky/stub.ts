import { codeAnchors, designAnchors, doublePayAnswer, gradientAnswer } from "@/contracts/fixtures/flicky";
import { parseFlickyAnswer, type AskEvent, type AskRequest } from "@/contracts/flicky";

// Stub for POST /api/flicky/ask: streams a recorded Flicky answer as SSE so
// the overlay can be built before the model call exists. The real version
// (Flicky prompt + snapshot + anchors → Claude stream) replaces `answerFor`.

const boardAnswer =
  "Start with the numbers: the sprint is 8 points over capacity. " +
  "[POINT:#board.capacity:the sprint is over capacity] " +
  "[POINT:#board.card.onboarding-anim:move this P2 to the backlog] " +
  "[POINT:#board.card.fix-double-charge:take the P0 fix into the sprint]";

function answerFor(req: AskRequest): { raw: string; fallbackAnchors: string[] } {
  if (req.workspace === "design") return { raw: gradientAnswer, fallbackAnchors: designAnchors.map((a) => a.id) };
  if (req.workspace === "board") {
    return { raw: boardAnswer, fallbackAnchors: ["board.capacity", "board.card.onboarding-anim", "board.card.fix-double-charge"] };
  }
  return { raw: doublePayAnswer, fallbackAnchors: codeAnchors.map((a) => a.id) };
}

const sse = (event: AskEvent) => `data: ${JSON.stringify(event)}\n\n`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Splits text into word-sized chunks, keeping each [TAG…] whole. */
function chunks(raw: string): string[] {
  return raw.match(/\[[^\]]*\]\s*|\S+\s*/g) ?? [raw];
}

export function stubAskStream(req: AskRequest, signal: AbortSignal): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const { raw, fallbackAnchors } = answerFor(req);
  // Steps are filtered by the anchors the page registered. With none sent,
  // the stub keeps the anchors of its own recorded answer.
  const known = new Set(req.anchors.length ? req.anchors.map((a) => a.id) : fallbackAnchors);

  return new ReadableStream({
    async start(controller) {
      try {
        for (const piece of chunks(raw)) {
          if (signal.aborted) return controller.close();
          controller.enqueue(encoder.encode(sse({ type: "chunk", text: piece })));
          await sleep(40);
        }
        const parsed = parseFlickyAnswer(raw, known);
        controller.enqueue(encoder.encode(sse({ type: "done", ...parsed })));
      } catch (error) {
        const message = error instanceof Error ? error.message : "The assistant failed.";
        controller.enqueue(encoder.encode(sse({ type: "error", message })));
      }
      controller.close();
    },
  });
}
