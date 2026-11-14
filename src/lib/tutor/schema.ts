import { z } from "zod";

// One mentor turn. The same shape comes from Claude (structured output) and
// from the offline demo mentor, so the chat UI has a single contract.

export const ExerciseSchema = z.object({
  title: z.string().describe("Short task title, e.g. 'Validate a signup request'"),
  task: z.string().describe("What the learner must do, 1-4 short sentences of markdown, framed as a real work task"),
  kind: z
    .enum(["python", "javascript", "written"])
    .describe("python/javascript open the code runner; written opens a text answer box"),
  starterCode: z.string().describe("Starter code for python/javascript; empty string for written"),
  tests: z
    .string()
    .describe(
      "For code: assertions appended after the learner's code that raise on failure " +
        "(Python `assert ...`, JavaScript `assert(cond, msg)`). Empty for written.",
    ),
});

export const StageSchema = z
  .enum(["intro", "quiz", "tasks", "fit", "done"])
  .describe(
    "intro: asking about experience; quiz: knowledge questions; tasks: practicing real tasks; " +
      "fit: asking if they like the role; done: fit verdict given",
  );

export const TutorTurnSchema = z.object({
  message: z.string().describe("What the mentor says, in markdown. Short paragraphs, code in fenced blocks."),
  quickReplies: z.array(z.string()).describe("0-4 short tap-to-send answers; answer options for quiz questions"),
  stage: StageSchema,
  level: z
    .string()
    .nullable()
    .describe("The learner's level once the quiz is scored, e.g. 'Beginner', 'Junior-ready basics'; otherwise null"),
  exercise: ExerciseSchema.nullable().describe("A practice task to show now, or null"),
  taskCompleted: z.boolean().describe("True only on the turn that confirms the learner passed the current task"),
});

export type TutorTurn = z.infer<typeof TutorTurnSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Stage = z.infer<typeof StageSchema>;

// What the browser sends to /api/tutor.
export const TutorRequestSchema = z.object({
  profession: z.string().max(64),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(12000),
      }),
    )
    .max(80),
  tasksCompleted: z.number().int().min(0).max(100),
});

export type TutorRequest = z.infer<typeof TutorRequestSchema>;
