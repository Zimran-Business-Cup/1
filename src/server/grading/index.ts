import { passedGrade } from "@/contracts/fixtures/tasks";
import type { Check, GradeResult, PublicTask, Submission } from "@/contracts/task";
import { RunnerUnavailable, runInSandbox, type RunResult } from "@/server/runner/client";
import { privateTask } from "@/server/tasks/private";
import { getPublicTask, starterFiles } from "@/server/tasks/store";
import { checkBoard, checkDesign, type BoardRules, type DesignRules } from "./rules";

// `passed` is decided by code only: hidden tests for code tasks, rules.ts for design and board.

const DESIGN_RULES: Record<string, DesignRules> = {
  "design-pay-button-1": { nodeId: "pay-button", fill: "linear", radius: 12, minContrast: 4.5 },
};

const BOARD_RULES: Record<string, BoardRules> = {
  "pm-sprint-at-risk-1": { mustBeInSprint: ["fix-double-charge"], everyP0InSprint: true },
};

function explain(checks: Check[]): string {
  const failed = checks.filter((c) => !c.passed);
  if (!failed.length) return "Every check passed. Nice work.";
  return [`${failed.length} of ${checks.length} checks failed:`, ...failed.map((c) => `- **${c.label}.** ${c.message ?? ""}`)].join("\n");
}

/** Only offer a next task the store can actually serve. */
function nextFor(passed: boolean) {
  return passed && passedGrade.next && getPublicTask(passedGrade.next.id) ? passedGrade.next : null;
}

/** The learner's files laid over the starter, so a submission may send only what changed. */
function mergedFiles(task: PublicTask, submitted: { path: string; content: string }[]) {
  const files = new Map(starterFiles(task));
  for (const f of submitted) files.set(f.path, f.content);
  return [...files].map(([path, content]) => ({ path, content }));
}

export function checksFromRun(run: RunResult): Check[] {
  if (run.timedOut) return [{ id: "time", label: "The code finishes within 10 seconds", passed: false, by: "code", message: run.error }];
  if (run.error && !run.tests.length) return [{ id: "runs", label: "The code runs", passed: false, by: "code", message: run.error }];
  return run.tests.map((t) => ({ id: t.name.replace(/^test_/, ""), label: t.label, passed: t.passed, by: "code" as const, message: t.passed ? null : t.message }));
}

async function gradeCode(task: PublicTask, submission: Submission): Promise<GradeResult | { error: string }> {
  const id = task.card.id;
  if (!submission.files?.length) return { error: "A code submission needs `files`." };
  const secret = privateTask(id);
  if (!secret || !task.code || !task.card.language) return { error: `No hidden tests for task ${id}.` };

  let run: RunResult | null = null;
  try {
    run = await runInSandbox({ language: task.card.language, files: mergedFiles(task, submission.files), entry: task.code.entry, tests: secret.hiddenTests });
  } catch (error) {
    if (!(error instanceof RunnerUnavailable)) throw error;
    console.error("[grading] runner unavailable:", error.message);
  }

  if (run) {
    const checks = checksFromRun(run);
    const passed = checks.length > 0 && checks.every((c) => c.passed);
    return { taskId: id, passed, checks, explanation: explain(checks), next: nextFor(passed) };
  }

  // No sandbox: say so instead of pretending the hidden tests ran.
  const starter = starterFiles(task);
  const untouched = submission.files.every((f) => starter.get(f.path) === f.content);
  const note = "(Sandbox unavailable: this is a stub grade, the hidden tests didn't run.)";
  if (untouched) {
    return {
      taskId: id,
      passed: false,
      checks: passedGrade.checks.map((c, i) => ({ ...c, passed: i === 0, message: i === 0 ? null : "The handler still creates a new payment on every request." })),
      explanation: `The starter code hasn't changed yet. ${note}`,
      next: null,
    };
  }
  return { ...passedGrade, taskId: id, next: nextFor(true), explanation: `${passedGrade.explanation} ${note}` };
}

export async function gradeSubmission(task: PublicTask, submission: Submission): Promise<GradeResult | { error: string }> {
  const id = task.card.id;

  if (task.card.workspace === "code") return gradeCode(task, submission);

  if (task.card.workspace === "design") {
    if (!submission.scene) return { error: "A design submission needs `scene`." };
    const rules = DESIGN_RULES[id];
    if (!rules) return { error: `No grading rules for task ${id}.` };
    const checks = checkDesign(submission.scene, rules);
    return { taskId: id, passed: checks.every((c) => c.passed), checks, explanation: explain(checks), next: null };
  }

  if (!submission.board) return { error: "A board submission needs `board` and `report`." };
  const rules = BOARD_RULES[id];
  if (!rules) return { error: `No grading rules for task ${id}.` };
  const checks = checkBoard(submission.board, submission.report, rules);
  return { taskId: id, passed: checks.every((c) => c.passed), checks, explanation: explain(checks), next: null };
}
