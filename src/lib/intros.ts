import { TASK_INTROS } from "@/contracts/fixtures/intros";
import type { TaskCard } from "@/contracts/task";

/** The lesson for a task. Cards saved in a session before lessons existed get it by task id. */
export const introFor = (card: TaskCard): string | null => card.intro ?? TASK_INTROS[card.id] ?? null;
