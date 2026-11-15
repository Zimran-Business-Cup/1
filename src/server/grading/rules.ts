import type { Check } from "@/contracts/task";
import type { BoardState, Report } from "@/contracts/workspace";

export interface BoardRules {
  mustBeInSprint: string[];
  everyP0InSprint: boolean;
}

const check = (id: string, label: string, passed: boolean, message: string | null = null): Check => ({
  id,
  label,
  passed,
  by: "code",
  message: passed ? null : message,
});

export function checkBoard(board: BoardState, report: Report | undefined, rules: BoardRules): Check[] {
  const sprint = board.cards.filter((c) => c.column === "sprint");
  const points = sprint.reduce((sum, c) => sum + c.points, 0);
  const missing = rules.mustBeInSprint.filter((id) => !sprint.some((c) => c.id === id));
  const p0Out = board.cards.filter((c) => c.priority === "P0" && c.column !== "sprint");
  const blocked = sprint.filter((c) => c.dependsOn.some((d) => !sprint.some((s) => s.id === d)));
  const emptyFields = report ? (["status", "risks", "ask"] as const).filter((k) => !report[k].trim()) : ["status", "risks", "ask"];

  const checks = [
    check("capacity", `The sprint fits the capacity of ${board.capacity} points`, points <= board.capacity, `The sprint has ${points} points.`),
    check("required", "The urgent fix is in the sprint", missing.length === 0, `Still in the backlog: ${missing.join(", ")}.`),
    check("dependencies", "Every task in the sprint has its dependencies in the sprint", blocked.length === 0, `Blocked: ${blocked.map((c) => c.title).join(", ")}.`),
    check("report", "The status report has a status, risks and an ask", emptyFields.length === 0, `Empty: ${emptyFields.join(", ")}.`),
  ];
  if (rules.everyP0InSprint) {
    checks.splice(2, 0, check("p0", "Every P0 is in the sprint", p0Out.length === 0, `P0 left out: ${p0Out.map((c) => c.title).join(", ")}.`));
  }
  return checks;
}
