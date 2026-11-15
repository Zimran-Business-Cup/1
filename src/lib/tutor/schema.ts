import { z } from "zod";
import { TaskCardSchema } from "@/contracts/task";

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
  startLanguage: z
    .enum(["python", "javascript"])
    .nullable()
    .describe("Programming roles: the language they chose to start with; 'Not sure yet' means python. Null in other roles"),
  codingLevel: z
    .enum(["new", "some", "comfortable"])
    .nullable()
    .describe(
      "Programming roles: new = never wrote code; some = tried tutorials or small scripts; " +
        "comfortable = writes code at work or has coded for a job. Null in other roles",
    ),
});

// Written by the model or by the offline demo mentor.
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

// Response of /api/tutor. The server attaches `task` on the turn that ends the interview.
export const TutorTurnSchema = MentorTurnSchema.extend({
  task: TaskCardSchema.nullable(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type MentorTurn = z.infer<typeof MentorTurnSchema>;
export type TutorTurn = z.infer<typeof TutorTurnSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Stage = z.infer<typeof StageSchema>;

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
