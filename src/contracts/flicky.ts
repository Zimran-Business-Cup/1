import { z } from "zod";
import { WorkspaceKindSchema } from "./workspace";

// The tag parser below is adapted from Flicky's element-detector.ts.
// Copyright (c) 2026 Julio Vaught and Flicky contributors. MIT License, see third_party/flicky/LICENSE.

/** e.g. code.run, code.lines.6-8, design.fill.type. No colons: tags use them as separators. */
export const ANCHOR_ID = /^[a-z0-9][a-z0-9.-]*$/;

export const AnchorSchema = z.object({
  id: z.string().regex(ANCHOR_ID),
  label: z.string().max(80).describe("What the element is, as the learner sees it"),
  role: z.enum(["button", "field", "lines", "layer", "card", "tab", "region"]),
});

export const SnapshotSchema = z.object({
  mediaType: z.literal("image/jpeg"),
  data: z.string().max(3_000_000).describe("Base64 JPEG of the workspace, longest side ≤ 1600px like Flicky (≤ ~2 MB)"),
  width: z.number().int().positive().describe("Image width in pixels"),
  height: z.number().int().positive(),
  viewportWidth: z.number().positive().describe("CSS pixels the image covers, to map points back"),
  viewportHeight: z.number().positive(),
});

export const FocusSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  anchorIds: z.array(z.string().regex(ANCHOR_ID)).max(100).describe("Anchors inside the circled area"),
});

export const AskRequestSchema = z.object({
  sessionId: z.string(),
  taskId: z.string().nullable(),
  workspace: WorkspaceKindSchema.nullable(),
  question: z.string().min(1).max(2000),
  anchors: z.array(AnchorSchema).max(300),
  snapshot: SnapshotSchema.nullable(),
  focus: FocusSchema.nullable().optional().describe("Area the learner circled while asking, in viewport CSS pixels"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
    .max(40),
});

/** Response of POST /api/flicky/transcribe (multipart `audio`, up to 25 MB). */
export const TranscribeResponseSchema = z.object({ text: z.string() });

/** Body of POST /api/flicky/speak, which returns audio/wav. */
export const SpeakRequestSchema = z.object({
  text: z.string().min(1).max(1500),
  voice: z.string().optional(),
});

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

/** Server-sent events of POST /api/flicky/ask. */
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
export type Focus = z.infer<typeof FocusSchema>;
export type TranscribeResponse = z.infer<typeof TranscribeResponseSchema>;
export type SpeakRequest = z.infer<typeof SpeakRequestSchema>;
export type WalkthroughTarget = z.infer<typeof WalkthroughTargetSchema>;
export type WalkthroughStep = z.infer<typeof WalkthroughStepSchema>;
export type Walkthrough = z.infer<typeof WalkthroughSchema>;
export type AskEvent = z.infer<typeof AskEventSchema>;

// [POINT:#design.fill.type:open the fill type]   anchor target
// [POINT:412,238:this corner:screen0]             pixel target in snapshot coordinates
const POINT_TAG = /\[POINT:(?:#([a-z0-9][a-z0-9.-]*):([^\]]+)|(\d+),(\d+):([^:\]]+)(?::screen(\d+))?)\]/g;
const TYPE_TAG = /\[TYPE:((?:[^\]\\]|\\.)+)\]/g;
/** Matches POINT and TYPE tags, complete ones only. */
export const TAG_STRIP = /\[(?:POINT|TYPE):(?:[^\]\\]|\\.)*\]/g;

/** Removes tags and the punctuation they leave behind ("first — [POINT…] — then", "branch — [POINT…]."). */
export function stripTags(text: string): string {
  return text
    .replace(TAG_STRIP, "")
    .replace(/[ \t]+([—–])(?:[ \t]*[—–])+/g, " $1")
    .replace(/[ \t]*[—–][ \t]*(?=[.,;:!?]|$)/gm, "")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

export interface ParsedAnswer {
  text: string;
  walkthrough: Walkthrough | null;
  typeRequests: string[];
}

/** A walkthrough longer than this is cut: past five hops the learner stops following. */
export const MAX_STEPS = 5;

const targetKey = (t: WalkthroughTarget) => (t.kind === "anchor" ? t.anchorId : `${t.x},${t.y}`);

/**
 * Parses a finished answer. Steps that point at anchors outside `knownAnchors` are dropped,
 * and so are pixel steps when no screenshot was sent (`pixels: false`): there is nothing to map them to.
 */
export function parseFlickyAnswer(raw: string, knownAnchors?: ReadonlySet<string>, { pixels = true }: { pixels?: boolean } = {}): ParsedAnswer {
  const targets: { label: string; target: WalkthroughTarget }[] = [];
  POINT_TAG.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = POINT_TAG.exec(raw)) !== null) {
    if (m[1]) {
      if (knownAnchors && !knownAnchors.has(m[1])) continue;
      targets.push({ label: m[2].trim(), target: { kind: "anchor", anchorId: m[1] } });
    } else {
      if (!pixels) continue;
      targets.push({
        label: m[5].trim(),
        target: { kind: "point", x: Number(m[3]), y: Number(m[4]), screen: Number(m[6] ?? 0) },
      });
    }
  }

  const typeRequests: string[] = [];
  TYPE_TAG.lastIndex = 0;
  while ((m = TYPE_TAG.exec(raw)) !== null) typeRequests.push(m[1].replace(/\\(.)/g, "$1"));

  // Pointing at the same place twice in a row is one step.
  const steps = targets.filter((t, i) => i === 0 || targetKey(t.target) !== targetKey(targets[i - 1].target)).slice(0, MAX_STEPS);
  const total = steps.length;
  return {
    text: stripTags(raw),
    walkthrough: total ? { steps: steps.map((t, i) => ({ step: i + 1, total, ...t })) } : null,
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

/** Flicky's per-step dwell time for timed walkthroughs, 2.6–5.5 s. */
export const dwellMs = (label: string) => Math.max(2600, Math.min(5500, 1800 + label.length * 80));
