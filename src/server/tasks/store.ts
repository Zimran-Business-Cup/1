import { FIXTURE_TASKS } from "@/contracts/fixtures/tasks";
import type { PublicTask } from "@/contracts/task";

export function getPublicTask(id: string): PublicTask | null {
  return FIXTURE_TASKS.find((t) => t.card.id === id) ?? null;
}

// First task per role. Roles without one keep the quiz flow.
const SEED_BY_ROLE: Record<string, string> = {
  "backend-engineer": "backend-double-pay-1",
  "product-designer": "design-pay-button-1",
  "project-manager": "pm-sprint-at-risk-1",
};

export function seedTaskFor(role: string): PublicTask | null {
  const id = SEED_BY_ROLE[role];
  return id ? getPublicTask(id) : null;
}

/** The starter files of a code task, to tell an untouched submission apart. */
export function starterFiles(task: PublicTask): Map<string, string> {
  return new Map((task.code?.files ?? []).map((f) => [f.path, f.content]));
}
