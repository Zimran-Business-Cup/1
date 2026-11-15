"use client";

import ReactMarkdown from "react-markdown";
import type { TaskCard } from "@/contracts/task";
import type { Profession } from "@/lib/catalog";
import { WORKSPACE_READY } from "@/lib/features";
import type { RunResult } from "@/lib/runner";
import type { ChatItem, Session } from "@/lib/sessions";
import type { Exercise } from "@/lib/tutor/schema";
import { CodeTask } from "./CodeTask";
import { GradeMessage } from "./GradeMessage";
import { RoleBrief } from "./RoleBrief";
import { TaskCardView } from "./TaskCardView";
import { WrittenTask } from "./WrittenTask";

/** How many tasks a free plan can open in one role. */
export const FREE_TASKS = 1;

function submissionText(ex: Exercise, payload: { code?: string; result?: RunResult; answer?: string }): string {
  if (ex.kind === "written") return `[Submission] written answer for "${ex.title}":\n${payload.answer}`;
  const r = payload.result!;
  const passed = r.ok && r.tests?.passed;
  const error = !r.ok ? r.error : r.tests?.error;
  return `[Submission] result: ${passed ? "passed" : "failed"}${error ? `\nerror: ${error}` : ""}\n\`\`\`${ex.kind}\n${payload.code}\n\`\`\``;
}

/** Task cards in order of appearance, with the verdicts that followed them. */
export function taskCards(items: ChatItem[]): { card: TaskCard; itemId: string }[] {
  return items.filter((i) => i.turn?.task).map((i) => ({ card: i.turn!.task!, itemId: i.id }));
}

export function passedTaskIds(items: ChatItem[]): Set<string> {
  return new Set(items.filter((i) => i.grade?.passed).map((i) => i.grade!.taskId));
}

function Avatar() {
  return (
    <span aria-hidden className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-hero text-sm font-bold text-paper">
      ai
    </span>
  );
}

export interface ChatThreadProps {
  profession: Profession;
  session: Session;
  plan: "free" | "pro";
  pending: boolean;
  error: string | null;
  /** Narrow layout for the workspace side panel: no role card, smaller type. */
  compact?: boolean;
  onSend: (content: string, submission?: ChatItem["submission"]) => void;
  onRetry: () => void;
  onOpenTask: (card: TaskCard) => void;
  onPaywall: () => void;
  onCatalog: () => void;
  onRestart: () => void;
}

/** The message list of a session: role card, mentor turns, task cards, verdicts. */
export function ChatThread({ profession, session, plan, pending, error, compact = false, onSend, onRetry, onOpenTask, onPaywall, onCatalog, onRestart }: ChatThreadProps) {
  const cards = taskCards(session.items);
  const passed = passedTaskIds(session.items);
  // Inline exercises (roles whose workspace isn't built yet); all but the latest are finished.
  const exerciseItems = session.items.filter((i) => i.turn?.exercise && !(i.turn.task && WORKSPACE_READY[i.turn.task.workspace]));
  const latestExerciseId = exerciseItems.at(-1)?.id;
  const lastItem = session.items.at(-1);
  const indent = compact ? "" : "sm:pl-11";

  return (
    <div className={`flex flex-col ${compact ? "gap-4" : "gap-5"}`}>
      {!compact && (
        <div className="flex gap-3">
          <Avatar />
          <div className="min-w-0 flex-1">
            <RoleBrief profession={profession} />
          </div>
        </div>
      )}

      {session.items.map((item) => {
        if (item.role === "user") {
          if (item.submission) {
            const ok = item.submission.passed;
            return (
              <div key={item.id} className="self-end rounded-[1.25rem] bg-hero-wash px-4 py-3 text-[15px]">
                <span className="font-semibold">
                  {item.submission.kind === "written" ? "Submitted my answer" : ok ? "✓ Submitted: all checks passed" : "Submitted: some checks failed"}
                </span>
              </div>
            );
          }
          return (
            <p key={item.id} className={`max-w-[85%] self-end whitespace-pre-wrap rounded-[1.25rem] bg-hero px-4 py-3 text-paper ${compact ? "text-[15px]" : "text-[16px]"}`}>
              {item.content}
            </p>
          );
        }

        const turn = item.turn!;
        const task = turn.task;
        const opensWorkspace = task ? WORKSPACE_READY[task.workspace] : false;
        const ex = opensWorkspace ? null : turn.exercise;
        const exIndex = exerciseItems.findIndex((e) => e.id === item.id);
        const exLocked = ex && plan === "free" && exIndex >= FREE_TASKS;
        const cardIndex = task ? cards.findIndex((c) => c.itemId === item.id) : -1;

        return (
          <div key={item.id} className="flex flex-col gap-3">
            {item.grade ? (
              <div className={indent}>
                <GradeMessage grade={item.grade} compact={compact} />
              </div>
            ) : (
              <div className="flex gap-3">
                {!compact && <Avatar />}
                <div className={`prose-chat min-w-0 leading-relaxed ${compact ? "text-[15px]" : "text-[16px]"}`}>
                  <ReactMarkdown>{turn.message}</ReactMarkdown>
                </div>
              </div>
            )}

            {task && opensWorkspace && (
              <div className={indent}>
                <TaskCardView
                  card={task}
                  number={cardIndex + 1}
                  compact={compact}
                  state={passed.has(task.id) ? "passed" : plan === "free" && cardIndex >= FREE_TASKS ? "locked" : "ready"}
                  onOpen={() => onOpenTask(task)}
                  onUnlock={onPaywall}
                />
              </div>
            )}

            {ex && (
              <div className={indent}>
                {item.id !== latestExerciseId ? (
                  <p className="rounded-[1.25rem] bg-mint-wash px-4 py-3 font-semibold text-mint">✓ {ex.title}</p>
                ) : exLocked ? (
                  <div className="rounded-[1.5rem] border border-line bg-mist p-6 text-center">
                    <p className="text-lg font-bold">{ex.title}</p>
                    <p className="mt-1 text-ink-soft">Your free task in this role is done. Pro unlocks this one and every task after it.</p>
                    <button onClick={onPaywall} className="mt-4 rounded-full bg-ink px-6 py-3 font-semibold text-paper">
                      Unlock with Pro
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="prose-chat rounded-[1.25rem] bg-steel/30 px-5 py-4 text-[16px] leading-relaxed">
                      <ReactMarkdown>{ex.task}</ReactMarkdown>
                    </div>
                    {ex.kind === "written" ? (
                      <WrittenTask key={item.id} exercise={ex} disabled={pending} onSubmit={(answer) => onSend(submissionText(ex, { answer }), { passed: true, kind: "written" })} />
                    ) : (
                      <CodeTask
                        key={item.id}
                        exercise={ex as Exercise & { kind: "python" | "javascript" }}
                        disabled={pending}
                        onSubmit={(code, result) =>
                          onSend(submissionText(ex, { code, result }), { passed: !!(result.ok && result.tests?.passed), kind: ex.kind as "python" | "javascript" })
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {item === lastItem && !pending && turn.quickReplies.length > 0 && (
              <div className={`flex flex-wrap gap-2 ${indent}`}>
                {turn.quickReplies.map((r) => (
                  <button key={r} onClick={() => onSend(r)} className="rounded-full border-2 border-hero px-4 py-2 font-semibold text-hero transition hover:bg-hero hover:text-paper">
                    {r}
                  </button>
                ))}
              </div>
            )}

            {item === lastItem && turn.stage === "done" && !compact && (
              <div className={`flex flex-wrap gap-2 ${indent}`}>
                <button onClick={onCatalog} className="rounded-full bg-ink px-5 py-2.5 font-semibold text-paper">Try another role</button>
                <button onClick={onPaywall} className="rounded-full bg-hero px-5 py-2.5 font-semibold text-paper transition hover:bg-hero-deep">Go deeper with Pro</button>
                <button onClick={onRestart} className="rounded-full bg-mist px-5 py-2.5 font-semibold">Start this role again</button>
              </div>
            )}
          </div>
        );
      })}

      {pending && (
        <div className="flex gap-3" aria-live="polite">
          {!compact && <Avatar />}
          <span className="flex items-center gap-1 pt-2" aria-label="Mentor is typing">
            {[0, 1, 2].map((d) => (
              <span key={d} className="size-2 rounded-full bg-ink-soft" style={{ animation: `blink 1.2s ${d * 0.2}s infinite` }} />
            ))}
          </span>
        </div>
      )}
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[1.25rem] bg-rose-wash px-4 py-3 text-rose">
          <span>{error}</span>
          <button onClick={onRetry} className="rounded-full bg-rose px-4 py-1.5 text-sm font-semibold text-paper">
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
