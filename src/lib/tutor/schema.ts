import { z } from "zod";
import { TaskCardSchema } from "@/contracts/task";

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
    "intro: interviewing the learner (job, experience, tools, time, goal); quiz: knowledge questions " +
      "(older roles only); tasks: practicing real tasks; fit: asking if they like the role; done: fit verdict given",
  );

export const ProfileSchema = z.object({
  currentJob: z.string().describe("What they do now, e.g. 'Accountant, 4 years'"),
  experience: z.string().describe("How much they've done this kind of work, in their words"),
  tools: z.array(z.string()).describe("Languages or tools they've tried for this role; empty if none"),
  hoursPerWeek: z.number().nullable().describe("Hours a week they can practice, if they said"),
  goal: z.string().describe("What they want to find out or reach"),
});

// What the model (or the demo mentor) writes. The server then adds `task`.
export const MentorTurnSchema = z.object({
  message: z.string().describe("What the mentor says, in markdown. Short paragraphs, code in fenced blocks."),
  quickReplies: z.array(z.string()).describe("0-4 short tap-to-send answers; answer options for quiz questions"),
  stage: StageSchema,
  level: z
    .string()
    .nullable()
    .describe("The learner's level once it is known, e.g. 'Complete beginner', 'Junior-ready basics'; otherwise null"),
  profile: ProfileSchema.nullable().describe("Fill it only on the turn that ends the interview; otherwise null"),
  exercise: ExerciseSchema.nullable().describe("A practice task to show now, or null"),
  taskCompleted: z.boolean().describe("True only on the turn that confirms the learner passed the current task"),
});

// What /api/tutor returns: the mentor turn plus the task card the platform
// attached (for the MVP roles, on the turn that ends the interview).
export const TutorTurnSchema = MentorTurnSchema.extend({
  task: TaskCardSchema.nullable(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type MentorTurn = z.infer<typeof MentorTurnSchema>;
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
