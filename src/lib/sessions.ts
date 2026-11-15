"use client";

import type { GradeResult } from "@/contracts/task";
import type { Stage, TutorTurn } from "./tutor/schema";

// Session storage in the browser for now (no login); the server keeps
// profiles and attempts in Postgres. Only this module touches localStorage.

export interface ChatItem {
  id: string;
  role: "assistant" | "user";
  /** What the API sees: plain text for the learner, turn JSON for the mentor. */
  content: string;
  turn?: TutorTurn;
  submission?: { passed: boolean; kind: "python" | "javascript" | "written" | "design" };
  /** A verdict from POST /api/tasks/:id/submit, shown as a result card. */
  grade?: GradeResult;
}

export interface Session {
  slug: string;
  createdAt: number;
  updatedAt: number;
  items: ChatItem[];
  tasksCompleted: number;
  level: string | null;
  stage: Stage;
  mode: "ai" | "demo" | null;
  /** The learner's unsent work per task id: file path → content (a design keeps its scene as "scene.json"). */
  drafts?: Record<string, Record<string, string>>;
}

interface Store {
  sessions: Record<string, Session>;
  plan: "free" | "pro";
}

const KEY = "1ry-space:v1";
const EMPTY: Store = { sessions: {}, plan: "free" };

function read(): Store {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Store) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function write(store: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Private mode or full storage: the session still works until reload.
  }
  window.dispatchEvent(new Event("1ry-space:store"));
}

export const newId = () => Math.random().toString(36).slice(2, 10);

export function newSession(slug: string): Session {
  const now = Date.now();
  return { slug, createdAt: now, updatedAt: now, items: [], tasksCompleted: 0, level: null, stage: "intro", mode: null };
}

export function loadSession(slug: string): Session {
  return read().sessions[slug] ?? newSession(slug);
}

export function saveSession(session: Session) {
  const store = read();
  store.sessions[session.slug] = { ...session, updatedAt: Date.now() };
  write(store);
}

export function deleteSession(slug: string) {
  const store = read();
  delete store.sessions[slug];
  write(store);
}

export function listSessions(): Session[] {
  return Object.values(read().sessions).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPlan(): Store["plan"] {
  return read().plan;
}

export function setPlan(plan: Store["plan"]) {
  const store = read();
  store.plan = plan;
  write(store);
}

/** Re-render on any store change, in this tab or another. */
export function subscribe(callback: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && callback();
  window.addEventListener("1ry-space:store", callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("1ry-space:store", callback);
    window.removeEventListener("storage", onStorage);
  };
}

export const STAGE_LABEL: Record<Stage, string> = {
  intro: "Getting started",
  quiz: "Level quiz",
  tasks: "Real tasks",
  fit: "Fit check",
  done: "Verdict ready",
};
