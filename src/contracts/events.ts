import { z } from "zod";

// Events the browser reports for learner metrics (POST /api/events).

const base = { sessionId: z.string(), taskId: z.string().nullable() };

export const EventSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("hint"),
    source: z.enum(["flicky", "chat"]),
    steps: z.number().int().min(0).describe("Walkthrough steps shown for this question"),
  }),
  z.object({
    ...base,
    type: z.literal("run"),
    passed: z.boolean().describe("Visible tests passed in the browser"),
  }),
  z.object({
    ...base,
    type: z.literal("rating"),
    interest: z.number().int().min(1).max(5),
    note: z.string().max(280),
  }),
]);

export type AppEvent = z.infer<typeof EventSchema>;
