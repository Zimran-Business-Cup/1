"use client";

import type { AppEvent } from "@/contracts/events";
import { GradeResultSchema, PublicTaskSchema, type GradeResult, type PublicTask, type Submission } from "@/contracts/task";

// Typed calls to the server. Every response is validated against its contract,
// so a server change that breaks the shape fails loudly here, not in the UI.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function readBody(res: Response): Promise<unknown> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (body as { error?: string } | null)?.error ?? `The server answered ${res.status}.`;
    throw new ApiError(message, res.status);
  }
  return body;
}

async function call(input: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new ApiError("You seem to be offline. Check your connection and try again.", 0);
  }
  return readBody(res);
}

/** GET /api/tasks/:id → the ticket, starter files and visible tests. */
export async function getTask(id: string): Promise<PublicTask> {
  return PublicTaskSchema.parse(await call(`/api/tasks/${encodeURIComponent(id)}`));
}

/** POST /api/tasks/:id/submit → the verdict from hidden tests or rule checks. */
export async function submitTask(submission: Submission): Promise<GradeResult> {
  const body = await call(`/api/tasks/${encodeURIComponent(submission.taskId)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });
  return GradeResultSchema.parse(body);
}

/** POST /api/events, fire and forget: metrics must never block the learner. */
export function postEvent(event: AppEvent): void {
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => {});
}
