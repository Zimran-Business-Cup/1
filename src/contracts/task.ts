import { z } from "zod";
import { BoardStateSchema, DesignSceneSchema, ReportSchema, WorkspaceKindSchema } from "./workspace";

// TaskCard is shown in the chat; PublicTask is sent to the browser when the task opens.
// Hidden tests and reference solutions stay on the server (src/server/tasks/private.ts).

export const CodeLanguageSchema = z.enum(["python", "javascript"]);

export const TaskCardSchema = z.object({
  id: z.string(),
  role: z.string().describe("Profession slug from src/lib/catalog.ts, e.g. backend-engineer"),
  title: z.string(),
  summary: z.string().describe("One sentence shown on the card"),
  workspace: WorkspaceKindSchema,
  language: CodeLanguageSchema.nullable().describe("Only for the code workspace"),
  minutes: z.number().int().positive().describe("Rough time to finish"),
});

export const TicketSchema = z.object({
  from: z.string().describe("Who asks, e.g. 'Maria, payments team lead'"),
  body: z.string().describe("The request in markdown, written like a real work message"),
  requirements: z.array(z.string()),
});

export const TaskFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  readonly: z.boolean(),
});

export const PublicTaskSchema = z.object({
  card: TaskCardSchema,
  ticket: TicketSchema,
  code: z
    .object({
      files: z.array(TaskFileSchema),
      entry: z.string().describe("File the runner executes"),
      visibleTests: z.string().describe("Assertions appended after the learner's code on Run"),
    })
    .nullable(),
  design: z.object({ scene: DesignSceneSchema }).nullable(),
  board: z.object({ board: BoardStateSchema, report: ReportSchema }).nullable(),
});

export const SubmissionSchema = z.object({
  taskId: z.string(),
  files: z.array(z.object({ path: z.string(), content: z.string() })).optional(),
  scene: DesignSceneSchema.optional(),
  board: BoardStateSchema.optional(),
  report: ReportSchema.optional(),
});

export const CheckSchema = z.object({
  id: z.string(),
  label: z.string().describe("Human-readable, e.g. 'A retry returns the first payment'"),
  passed: z.boolean(),
  by: z.enum(["code", "model"]).describe("code checks decide `passed`; model checks only advise"),
  message: z.string().nullable(),
});

export const GradeResultSchema = z.object({
  taskId: z.string(),
  passed: z.boolean().describe("Set from code checks only"),
  checks: z.array(CheckSchema),
  explanation: z.string().describe("Model-written markdown that explains the checks"),
  next: TaskCardSchema.nullable().describe("The next task, usually the same task with a new edge case"),
});

export type CodeLanguage = z.infer<typeof CodeLanguageSchema>;
export type TaskCard = z.infer<typeof TaskCardSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type TaskFile = z.infer<typeof TaskFileSchema>;
export type PublicTask = z.infer<typeof PublicTaskSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type Check = z.infer<typeof CheckSchema>;
export type GradeResult = z.infer<typeof GradeResultSchema>;
