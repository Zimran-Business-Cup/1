import { FIXTURE_TASKS } from "@/contracts/fixtures/tasks";
import type { PublicTask } from "@/contracts/task";

// Task store. For now it serves the fixture tasks; the Postgres-backed store
// with generated, self-checked tasks replaces it behind the same functions.

export function getPublicTask(id: string): PublicTask | null {
  return FIXTURE_TASKS.find((t) => t.card.id === id) ?? null;
}

// The first task of each MVP role. Roles without an entry keep the old flow
// (quiz, then exercises the model writes).
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
