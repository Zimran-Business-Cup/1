import { passedGrade } from "@/contracts/fixtures/tasks";
import type { Check, GradeResult, PublicTask, Submission } from "@/contracts/task";
import { getPublicTask, starterFiles } from "@/server/tasks/store";
import { checkBoard, checkDesign, type BoardRules, type DesignRules } from "./rules";

// Submission → GradeResult. `passed` comes only from code checks.
// Design and board tasks are graded for real by rules.ts. Code tasks are a
// stub until the runner runs the hidden tests: an untouched starter fails,
// anything else gets the sample passing grade.

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

export function gradeSubmission(task: PublicTask, submission: Submission): GradeResult | { error: string } {
  const id = task.card.id;

  if (task.card.workspace === "code") {
    if (!submission.files?.length) return { error: "A code submission needs `files`." };
    const starter = starterFiles(task);
    const untouched = submission.files.every((f) => starter.get(f.path) === f.content);
    if (untouched) {
      return {
        taskId: id,
        passed: false,
        checks: passedGrade.checks.map((c, i) => ({ ...c, passed: i === 0, message: i === 0 ? null : "The handler still creates a new payment on every request." })),
        explanation: "The starter code hasn't changed yet. A retry with the same key still creates a second payment. (Stub grade: hidden tests run once the sandbox is up.)",
        next: null,
      };
    }
    // Only offer a next task the store can actually serve.
    const next = passedGrade.next && getPublicTask(passedGrade.next.id) ? passedGrade.next : null;
    return { ...passedGrade, taskId: id, next, explanation: `${passedGrade.explanation} (Stub grade: hidden tests run once the sandbox is up.)` };
  }

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
