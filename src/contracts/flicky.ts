import { z } from "zod";
import { WorkspaceKindSchema } from "./workspace";

// Contract for the Flicky port: the voice cursor assistant that lives over
// every workspace. Browser side: src/lib/flicky (bridge) + src/components/flicky
// (ported UI). Server side: src/app/api/flicky/* + src/server/flicky.
//
// The tag parser at the bottom is adapted from Flicky's element-detector.ts:
//   Copyright (c) 2026 Julio Vaught and Flicky contributors. MIT License.
//   https://github.com/pango07/flicky — full notice in third_party/flicky/LICENSE.
// Changes: anchor targets ([POINT:#id:label]) next to Flicky's pixel targets,
// and unknown anchors are dropped.

// ---------- anchors ----------

/** Anchor ids: lowercase dotted paths, e.g. code.run, code.lines.6-8,
 *  design.layer.pay-button, design.fill.type, board.card.fix-double-charge,
 *  report.field.status. No colons: the tag format uses them as separators. */
export const ANCHOR_ID = /^[a-z0-9][a-z0-9.-]*$/;

export const AnchorSchema = z.object({
  id: z.string().regex(ANCHOR_ID),
  label: z.string().max(80).describe("What the element is, as the learner sees it"),
  role: z.enum(["button", "field", "lines", "layer", "card", "tab", "region"]),
});

// ---------- requests ----------

export const SnapshotSchema = z.object({
  mediaType: z.literal("image/jpeg"),
  data: z.string().max(3_000_000).describe("Base64 JPEG of the workspace, longest side ≤ 1600px like Flicky (≤ ~2 MB)"),
  width: z.number().int().positive().describe("Image width in pixels"),
  height: z.number().int().positive(),
  viewportWidth: z.number().positive().describe("CSS pixels the image covers, to map points back"),
  viewportHeight: z.number().positive(),
});

export const AskRequestSchema = z.object({
  sessionId: z.string(),
  taskId: z.string().nullable(),
  workspace: WorkspaceKindSchema.nullable(),
  question: z.string().min(1).max(2000),
  anchors: z.array(AnchorSchema).max(300),
  snapshot: SnapshotSchema.nullable(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
    .max(40),
});

/** POST /api/flicky/transcribe takes multipart/form-data with an `audio` file
 *  (webm/opus or wav, ≤ 25 MB) and returns this. */
export const TranscribeResponseSchema = z.object({ text: z.string() });

/** POST /api/flicky/speak returns audio/wav (Kokoro) for this body. */
export const SpeakRequestSchema = z.object({
  text: z.string().min(1).max(1500),
  voice: z.string().optional(),
});

// ---------- walkthrough ----------

export const WalkthroughTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("anchor"), anchorId: z.string() }),
  z.object({ kind: z.literal("point"), x: z.number(), y: z.number(), screen: z.number().int() }),
]);

export const WalkthroughStepSchema = z.object({
  step: z.number().int().positive(),
  total: z.number().int().positive(),
  label: z.string().describe("Caption next to the cursor, e.g. 'open the fill type'"),
  target: WalkthroughTargetSchema,
});

export const WalkthroughSchema = z.object({ steps: z.array(WalkthroughStepSchema).min(1) });

/** Events of the text/event-stream answer from POST /api/flicky/ask. */
export const AskEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("transcript"), text: z.string() }),
  z.object({ type: z.literal("chunk"), text: z.string().describe("Raw model text; may hold partial tags") }),
  z.object({
    type: z.literal("done"),
    text: z.string().describe("Answer with every tag stripped: show it and speak it"),
    walkthrough: WalkthroughSchema.nullable(),
    typeRequests: z.array(z.string()),
  }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export type Anchor = z.infer<typeof AnchorSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
export type AskRequest = z.infer<typeof AskRequestSchema>;
export type TranscribeResponse = z.infer<typeof TranscribeResponseSchema>;
export type SpeakRequest = z.infer<typeof SpeakRequestSchema>;
export type WalkthroughTarget = z.infer<typeof WalkthroughTargetSchema>;
export type WalkthroughStep = z.infer<typeof WalkthroughStepSchema>;
export type Walkthrough = z.infer<typeof WalkthroughSchema>;
export type AskEvent = z.infer<typeof AskEventSchema>;

// ---------- tag parser (shared by server and browser) ----------

// [POINT:#design.fill.type:open the fill type]      → anchor target
// [POINT:412,238:this corner:screen0]                → pixel target in snapshot coordinates
const POINT_TAG = /\[POINT:(?:#([a-z0-9][a-z0-9.-]*):([^\]]+)|(\d+),(\d+):([^:\]]+)(?::screen(\d+))?)\]/g;
const TYPE_TAG = /\[TYPE:((?:[^\]\\]|\\.)+)\]/g;
/** Strips POINT and TYPE tags from text before it is shown or spoken. */
export const TAG_STRIP = /\[(?:POINT|TYPE):(?:[^\]\\]|\\.)*\]/g;

export interface ParsedAnswer {
  text: string;
  walkthrough: Walkthrough | null;
  typeRequests: string[];
}

/**
 * Parses a finished model answer. Pass `knownAnchors` to drop steps that point
 * at anchors the workspace never registered, so the cursor can't fly to a
 * button that doesn't exist.
 */
export function parseFlickyAnswer(raw: string, knownAnchors?: ReadonlySet<string>): ParsedAnswer {
  const targets: { label: string; target: WalkthroughTarget }[] = [];
  POINT_TAG.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = POINT_TAG.exec(raw)) !== null) {
    if (m[1]) {
      if (knownAnchors && !knownAnchors.has(m[1])) continue;
      targets.push({ label: m[2].trim(), target: { kind: "anchor", anchorId: m[1] } });
    } else {
      targets.push({
        label: m[5].trim(),
        target: { kind: "point", x: Number(m[3]), y: Number(m[4]), screen: Number(m[6] ?? 0) },
      });
    }
  }

  const typeRequests: string[] = [];
  TYPE_TAG.lastIndex = 0;
  while ((m = TYPE_TAG.exec(raw)) !== null) typeRequests.push(m[1].replace(/\\(.)/g, "$1"));

  const total = targets.length;
  return {
    text: raw.replace(TAG_STRIP, "").replace(/[ \t]{2,}/g, " ").trim(),
    walkthrough: total ? { steps: targets.map((t, i) => ({ step: i + 1, total, ...t })) } : null,
    typeRequests,
  };
}

/** Maps a pixel target from snapshot coordinates to viewport CSS pixels. */
export function pointToViewport(target: { x: number; y: number }, snap: Pick<Snapshot, "width" | "height" | "viewportWidth" | "viewportHeight">) {
  return {
    x: (target.x * snap.viewportWidth) / snap.width,
    y: (target.y * snap.viewportHeight) / snap.height,
  };
}

/** Flicky's dwell time per step when a step advances on a timer:
 *  longer captions stay longer, 2.6 s to 5.5 s. */
export const dwellMs = (label: string) => Math.max(2600, Math.min(5500, 1800 + label.length * 80));
