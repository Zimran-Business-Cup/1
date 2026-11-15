import { DESIGN_LADDER, DESIGN_TASKS } from "@/contracts/fixtures/design-ladder";
import { TASK_INTROS } from "@/contracts/fixtures/intros";
import { LADDERS, LADDER_TASKS } from "@/contracts/fixtures/ladder";
import { FIXTURE_TASKS } from "@/contracts/fixtures/tasks";
import type { PublicTask, TaskCard } from "@/contracts/task";
import type { Profile } from "@/lib/tutor/schema";

// Every card carries its lesson, so the chat can show it when the task is handed out.
const ALL_TASKS: PublicTask[] = [...FIXTURE_TASKS, ...LADDER_TASKS, ...DESIGN_TASKS].map((t) => ({ ...t, card: { ...t.card, intro: TASK_INTROS[t.card.id] ?? null } }));

export function getPublicTask(id: string): PublicTask | null {
  return ALL_TASKS.find((t) => t.card.id === id) ?? null;
}

// First task per role. Roles without one keep the quiz flow.
const SEED_BY_ROLE: Record<string, string> = {
  "backend-engineer": "backend-double-pay-1",
  "product-designer": DESIGN_LADDER[0],
  "project-manager": "pm-sprint-at-risk-1",
};

export function seedTaskFor(role: string): PublicTask | null {
  const id = SEED_BY_ROLE[role];
  return id ? getPublicTask(id) : null;
}

/** The role whose tasks come from the ladders in src/contracts/fixtures/ladder.ts. */
export const LADDER_ROLE = "backend-engineer";

// Where a learner starts on the ladder: never coded → printing a line; tried a tutorial →
// math with variables; codes at work → writing functions.
const START_RUNG: Record<NonNullable<Profile["codingLevel"]>, number> = { new: 0, some: 3, comfortable: 7 };

/** The first task after the interview: a ladder rung for backend, the seed task elsewhere. */
export function startTaskFor(role: string, profile: Profile | null): PublicTask | null {
  if (role === LADDER_ROLE && profile) {
    const ladder = LADDERS[profile.startLanguage ?? "python"];
    return getPublicTask(ladder[START_RUNG[profile.codingLevel ?? "new"]]) ?? seedTaskFor(role);
  }
  return seedTaskFor(role);
}

/** The card of the next rung after a passed task, or null at the top of the ladder. */
export function nextTaskAfter(id: string): TaskCard | null {
  for (const ids of [...Object.values(LADDERS), DESIGN_LADDER]) {
    const i = ids.indexOf(id);
    if (i >= 0 && i + 1 < ids.length) return getPublicTask(ids[i + 1])?.card ?? null;
  }
  return null;
}

/** The starter files of a code task, to tell an untouched submission apart. */
export function starterFiles(task: PublicTask): Map<string, string> {
  return new Map((task.code?.files ?? []).map((f) => [f.path, f.content]));
}
