import type { PublicTask } from "@/contracts/task";
import type { Exercise, MentorTurn, Profile, TutorTurn } from "@/lib/tutor/schema";
import { LADDER_ROLE, seedTaskFor, startTaskFor } from "./store";

// The server, not the model, picks the task on the turn that ends the interview.

/** Language and level read from the learner's own answers, so the first task matches what they
 *  said even when the model fills the profile differently. Unclear answers keep the model's values. */
function withAnswers(profile: Profile, history: { role: string; content: string }[]): Profile {
  const answers = history.filter((m) => m.role === "user").map((m) => m.content.toLowerCase());
  const said = (re: RegExp) => answers.some((a) => re.test(a));
  const js = said(/\bjavascript\b|\bjs\b/);
  const python = said(/\bpython\b/);
  const first = answers[0] ?? "";
  // "I work in sales, no coding" is a beginner: negations first, and "codes at work" needs both
  // a coding word and a work word. Someone who never mentions code starts at the first rung.
  const NEVER = /\b(never|not yet|nothing|none|zero|no (coding|code|programming|experience)|haven'?t (coded|written|programmed)|don'?t (code|program)|complete beginner)\b/;
  const CODES = /\b(cod(e|es|ed|ing)|program(s|med|ming)?|develop(er|ers|ment)?|engineer(s|ing)?|scripts?|software|sql)\b/;
  const AT_WORK = /\b(work|job|professional(ly)?|years?|daily|every day)\b/;
  const LEARNING = /\b(tutorials?|tried|played|basics|course|bootcamp)\b/;
  const codingLevel = NEVER.test(first)
    ? "new"
    : CODES.test(first) && AT_WORK.test(first)
      ? "comfortable"
      : LEARNING.test(first)
        ? "some"
        : answers.some((a) => CODES.test(a))
          ? profile.codingLevel
          : "new";
  return {
    ...profile,
    startLanguage: js && !python ? "javascript" : python && !js ? "python" : (profile.startLanguage ?? "python"),
    codingLevel: codingLevel ?? "new",
  };
}

const MIN_ANSWERS = 2;
const WANTS_TO_START = /\b(start|skip|let'?s go|ready|give me (a|the) task|show me (a|the) task)\b/i;

/** Some models fill an empty profile on the first turn, so the server decides when the interview
 *  is over: a profile with content, after two answers or when the learner asks to start. */
function interviewDone(profile: Profile, history: { role: string; content: string }[]): boolean {
  const filled = [profile.currentJob, profile.experience, profile.goal].some((v) => v.trim()) || profile.tools.length > 0;
  const answers = history.filter((m) => m.role === "user").map((m) => m.content);
  return filled && (answers.length >= MIN_ANSWERS || WANTS_TO_START.test(answers[answers.length - 1] ?? ""));
}

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

/** The task as an inline exercise for the current chat UI. */
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
  if (alreadyAssigned(history)) return { ...turn, exercise: null, task: null };
  if (turn.profile && interviewDone(turn.profile, history)) {
    const profile = role === LADDER_ROLE ? withAnswers(turn.profile, history) : turn.profile;
    const first = startTaskFor(role, profile) ?? seed;
    return { ...turn, profile, stage: "tasks", task: first.card, exercise: legacyExercise(first) };
  }
  // Still interviewing: tasks come only from the platform, and only after the interview.
  return { ...turn, profile: null, stage: turn.stage === "tasks" ? "intro" : turn.stage, exercise: null, task: null };
}
