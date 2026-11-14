import { z } from "zod";

// Design canvas and sprint board state, as submitted for grading.

export const WorkspaceKindSchema = z
  .enum(["code", "design", "board"])
  .describe("code: IDE; design: Figma-like canvas; board: sprint board + status report");

export const FillSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("solid"), color: z.string().describe("CSS hex, e.g. #2547D0") }),
  z.object({
    type: z.literal("linear"),
    angle: z.number().describe("Degrees, 0 = left to right"),
    stops: z
      .array(z.object({ offset: z.number().min(0).max(1), color: z.string() }))
      .min(2),
  }),
]);

export const SceneNodeSchema = z.object({
  id: z.string().describe("Stable id; also used in anchors as design.layer.<id>"),
  name: z.string().describe("Layer name shown in the layers panel"),
  type: z.enum(["frame", "rect", "text"]),
  parentId: z.string().nullable(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  radius: z.number().min(0),
  fill: FillSchema.nullable(),
  text: z.string().nullable().describe("Text content for text nodes and labelled rects"),
  textColor: z.string().nullable(),
  fontSize: z.number().nullable(),
});

export const DesignSceneSchema = z.object({
  width: z.number(),
  height: z.number(),
  nodes: z.array(SceneNodeSchema),
});

export const BoardCardSchema = z.object({
  id: z.string().describe("Also used in anchors as board.card.<id>"),
  title: z.string(),
  priority: z.enum(["P0", "P1", "P2"]),
  points: z.number().int().min(0),
  column: z.enum(["backlog", "sprint"]),
  dependsOn: z.array(z.string()),
});

export const BoardStateSchema = z.object({
  sprintName: z.string(),
  capacity: z.number().int().positive().describe("Story points the team can take"),
  cards: z.array(BoardCardSchema),
});

export const ReportSchema = z.object({
  status: z.string().describe("One word or short phrase: On track / At risk / Off track"),
  risks: z.string().describe("What may slip and by when"),
  ask: z.string().describe("A concrete request to the stakeholder"),
});

export type WorkspaceKind = z.infer<typeof WorkspaceKindSchema>;
export type Fill = z.infer<typeof FillSchema>;
export type SceneNode = z.infer<typeof SceneNodeSchema>;
export type DesignScene = z.infer<typeof DesignSceneSchema>;
export type BoardCard = z.infer<typeof BoardCardSchema>;
export type BoardState = z.infer<typeof BoardStateSchema>;
export type Report = z.infer<typeof ReportSchema>;
