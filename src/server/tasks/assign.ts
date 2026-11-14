import type { PublicTask } from "@/contracts/task";
import type { Exercise, MentorTurn, TutorTurn } from "@/lib/tutor/schema";
import { seedTaskFor } from "./store";

// Attaches the task card to the mentor turn that ends the interview.
// The model never invents task ids: the platform picks the task.

function alreadyAssigned(history: { role: string; content: string }[]): boolean {
  return history.some((m) => {
    if (m.role !== "assistant") return false;
    try {
      return Boolean((JSON.parse(m.content) as { task?: unknown }).task);
    } catch {
      return false;
    }
  });
}

/** The same task as an inline exercise, for the chat UI until the workspace lands. */
export function legacyExercise(task: PublicTask): Exercise {
  const brief = `${task.ticket.body}\n\n${task.ticket.requirements.map((r) => `- ${r}`).join("\n")}`;
  if (task.code && task.card.language) {
    const entry = task.code.files.find((f) => f.path === task.code!.entry) ?? task.code.files[0];
    return { title: task.card.title, task: brief, kind: task.card.language, starterCode: entry?.content ?? "", tests: task.code.visibleTests };
  }
  return {
    title: task.card.title,
    task: `${brief}\n\nDescribe exactly what you would change and why.`,
    kind: "written",
    starterCode: "",
    tests: "",
  };
}

export function attachTask(role: string, history: { role: string; content: string }[], turn: MentorTurn): TutorTurn {
  const seed = seedTaskFor(role);
  if (!seed) return { ...turn, task: null };
  if (turn.profile && !alreadyAssigned(history)) {
    return { ...turn, stage: "tasks", task: seed.card, exercise: legacyExercise(seed) };
  }
  // In MVP roles tasks come only from the platform.
  return { ...turn, exercise: null, task: null };
}
