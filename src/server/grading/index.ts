import type { Check, GradeResult, PublicTask, Submission } from "@/contracts/task";
import { RunnerUnavailable, runInSandbox, type RunResult } from "@/server/runner/client";
import { privateTask } from "@/server/tasks/private";
import { nextTaskAfter, starterFiles } from "@/server/tasks/store";
import { checkDesign, DESIGN_RULES } from "./design-rules";
import { checkBoard, type BoardRules } from "./rules";

// `passed` is decided by code only: hidden tests for code tasks, rules.ts for design and board.

const BOARD_RULES: Record<string, BoardRules> = {
  "pm-sprint-at-risk-1": { mustBeInSprint: ["fix-double-charge"], everyP0InSprint: true },
};

function explain(checks: Check[]): string {
  const failed = checks.filter((c) => !c.passed);
  if (!failed.length) return "Every check passed. Nice work.";
  return [`${failed.length} of ${checks.length} checks failed:`, ...failed.map((c) => `- **${c.label}.** ${c.message ?? ""}`)].join("\n");
}

/** After a pass, the next rung of the task's ladder; null at the top or on a fail. */
function nextFor(id: string, passed: boolean) {
  return passed ? nextTaskAfter(id) : null;
}

/** Check ids and labels read from the hidden tests, for the stub grade when the sandbox is down. */
function hiddenCheckLabels(tests: string): { id: string; label: string }[] {
  const python = [...tests.matchAll(/def (test_\w+)\(\):\s*\n\s*"""(.+?)"""/g)].map((m) => ({ id: m[1].replace(/^test_/, ""), label: m[2] }));
  if (python.length) return python;
  return [...tests.matchAll(/test\("([^"]+)"/g)].map((m) => ({ id: m[1], label: m[1] }));
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
    return { taskId: id, passed, checks, explanation: explain(checks), next: nextFor(id, passed) };
  }

  // No sandbox: say so instead of pretending the hidden tests ran.
  const starter = starterFiles(task);
  const untouched = submission.files.every((f) => starter.get(f.path) === f.content);
  const note = "(Sandbox unavailable: this is a stub grade, the hidden tests didn't run.)";
  const stubChecks = (passed: boolean): Check[] =>
    hiddenCheckLabels(secret.hiddenTests).map((c) => ({ ...c, passed, by: "code", message: passed ? null : "The starter code hasn't changed yet." }));
  if (untouched) {
    return { taskId: id, passed: false, checks: stubChecks(false), explanation: `The starter code hasn't changed yet. ${note}`, next: null };
  }
  return { taskId: id, passed: true, checks: stubChecks(true), explanation: `Every check passed. ${note}`, next: nextFor(id, true) };
}

export async function gradeSubmission(task: PublicTask, submission: Submission): Promise<GradeResult | { error: string }> {
  const id = task.card.id;

  if (task.card.workspace === "code") return gradeCode(task, submission);

  if (task.card.workspace === "design") {
    if (!submission.scene) return { error: "A design submission needs `scene`." };
    const rules = DESIGN_RULES[id];
    if (!rules) return { error: `No grading rules for task ${id}.` };
    const checks = checkDesign(submission.scene, rules);
    const passed = checks.every((c) => c.passed);
    return { taskId: id, passed, checks, explanation: explain(checks), next: nextFor(id, passed) };
  }

  if (!submission.board) return { error: "A board submission needs `board` and `report`." };
  const rules = BOARD_RULES[id];
  if (!rules) return { error: `No grading rules for task ${id}.` };
  const checks = checkBoard(submission.board, submission.report, rules);
  return { taskId: id, passed: checks.every((c) => c.passed), checks, explanation: explain(checks), next: null };
}
