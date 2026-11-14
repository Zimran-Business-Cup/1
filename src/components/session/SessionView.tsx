"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Profession } from "@/lib/catalog";
import type { RunResult } from "@/lib/runner";
import { getPlan, loadSession, newId, newSession, saveSession, setPlan, type ChatItem, type Session } from "@/lib/sessions";
import type { Exercise, Stage, TutorTurn } from "@/lib/tutor/schema";
import { CatalogModal } from "../CatalogModal";
import { DotGrid } from "../DotGrid";
import { PanelLeft } from "lucide-react";
import { RoleIcon } from "../RoleIcon";
import { CodeTask } from "./CodeTask";
import { Paywall } from "./Paywall";
import { RoleBrief } from "./RoleBrief";
import { Sidebar } from "./Sidebar";
import { WrittenTask } from "./WrittenTask";

const FREE_TASKS = 1;
const STAGES: { id: Stage; label: string }[] = [
  { id: "intro", label: "Role" },
  { id: "quiz", label: "Quiz" },
  { id: "tasks", label: "Tasks" },
  { id: "fit", label: "Fit check" },
  { id: "done", label: "Verdict" },
];

function submissionText(ex: Exercise, payload: { code?: string; result?: RunResult; answer?: string }): string {
  if (ex.kind === "written") return `[Submission] written answer for "${ex.title}":\n${payload.answer}`;
  const r = payload.result!;
  const passed = r.ok && r.tests?.passed;
  const error = !r.ok ? r.error : r.tests?.error;
  return `[Submission] result: ${passed ? "passed" : "failed"}${error ? `\nerror: ${error}` : ""}\n\`\`\`${ex.kind}\n${payload.code}\n\`\`\``;
}

const SIDEBAR_KEY = "1ry-space:sidebar";
const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

function saveSidebarPref(open: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, open ? "open" : "closed");
  } catch {}
}

// Open by default on desktop (remembering the last choice), closed on phones.
function initialSidebarOpen(): boolean {
  if (!isDesktop()) return false;
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) !== "closed";
  } catch {
    return true;
  }
}

// Sessions whose opening mentor message was already requested in this tab,
// so React's development double-mount doesn't ask twice.
const opened = new Set<string>();

export function SessionView({ profession }: { profession: Profession }) {
  const [session, setSession] = useState<Session>(() => loadSession(profession.slug));
  // A brand-new session is "pending" from the start: the mentor speaks first.
  const [pending, setPending] = useState(() => session.items.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [plan, setPlanState] = useState<"free" | "pro">(() => getPlan());
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const bottom = useRef<HTMLDivElement>(null);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => {
      if (isDesktop()) saveSidebarPref(!open);
      return !open;
    });
  }, []);

  // Cmd/Ctrl + B toggles the sessions sidebar, like most desktop apps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebar]);

  const ask = useCallback(
    // Callers set `pending` before calling; this only resolves it.
    async (next: Session) => {
      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profession: next.slug,
            history: next.items.map(({ role, content }) => ({ role, content })),
            tasksCompleted: next.tasksCompleted,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "The mentor didn't answer. Send your message again.");
          return;
        }
        const turn = data.turn as TutorTurn;
        const updated: Session = {
          ...next,
          items: [...next.items, { id: newId(), role: "assistant", content: JSON.stringify(turn), turn }],
          stage: turn.stage,
          level: turn.level ?? next.level,
          tasksCompleted: next.tasksCompleted + (turn.taskCompleted ? 1 : 0),
          mode: data.mode,
        };
        saveSession(updated);
        setSession(updated);
      } catch {
        setError("You seem to be offline. Check your connection and send again.");
      } finally {
        setPending(false);
      }
    },
    [],
  );

  // A brand-new session starts with the mentor speaking first.
  useEffect(() => {
    if (session.items.length > 0 || opened.has(session.slug)) return;
    opened.add(session.slug);
    saveSession(session);
    // Starts the opening request; its state updates land after the network response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void ask(session);
  }, [session, ask]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session.items.length, pending]);

  function send(content: string, submission?: ChatItem["submission"]) {
    if (pending || !content.trim()) return;
    const next: Session = { ...session, items: [...session.items, { id: newId(), role: "user", content, submission }] };
    saveSession(next);
    setSession(next);
    setDraft("");
    retry(next);
  }

  function retry(next: Session) {
    setError(null);
    setPending(true);
    void ask(next);
  }

  function upgrade() {
    setPlan("pro");
    setPlanState("pro");
    setPaywallOpen(false);
  }

  function restart() {
    const fresh = newSession(profession.slug);
    saveSession(fresh);
    setSession(fresh);
    retry(fresh);
  }

  // Exercises in order; everything before the latest one is finished.
  const exerciseItems = session.items.filter((i) => i.turn?.exercise);
  const latestExerciseId = exerciseItems.at(-1)?.id;
  const lastItem = session.items.at(-1);
  const stageIndex = STAGES.findIndex((s) => s.id === session.stage);

  return (
    <div className="relative flex h-dvh bg-hero">
      <DotGrid subtle />
      {/* Sessions sidebar: slides in and out; an overlay drawer on small screens */}
      <aside id="sessions-sidebar" aria-label="Your sessions" inert={!sidebarOpen} className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__inner">
          <Sidebar current={profession.slug} onNewRole={() => setCatalogOpen(true)} onUpgrade={() => setPaywallOpen(true)} />
        </div>
      </aside>
      <button aria-label="Hide sessions" tabIndex={-1} onClick={toggleSidebar} className={`sidebar-scrim ${sidebarOpen ? "sidebar-scrim--on" : ""}`} />

      {/* Chat */}
      <main className="relative m-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[2rem] bg-paper shadow-[0_24px_60px_-20px_rgba(13,13,20,0.35)]">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Hide sessions" : "Show sessions"}
            aria-expanded={sidebarOpen}
            aria-controls="sessions-sidebar"
            title={sidebarOpen ? "Hide sessions (⌘B)" : "Show sessions (⌘B)"}
            className="sidebar-toggle"
          >
            <PanelLeft size={20} strokeWidth={1.9} />
          </button>
          <RoleIcon slug={profession.slug} size={40} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-[-0.02em]">{profession.name}</h1>
            <ol className="flex flex-wrap gap-x-3 text-sm" aria-label="Session progress">
              {STAGES.map((s, i) => (
                <li key={s.id} aria-current={i === stageIndex ? "step" : undefined} className={i < stageIndex ? "text-mint" : i === stageIndex ? "font-semibold text-hero" : "text-ink-soft/60"}>
                  {i < stageIndex ? "✓ " : ""}
                  {s.label}
                </li>
              ))}
            </ol>
          </div>
        </header>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
              {/* The role card is the mentor's first message in every session */}
              <div className="flex gap-3">
                <span aria-hidden className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-hero text-sm font-bold text-paper">ai</span>
                <div className="min-w-0 flex-1">
                  <RoleBrief profession={profession} />
                </div>
              </div>
              {session.items.map((item) => {
                if (item.role === "user") {
                  if (item.submission) {
                    const passed = item.submission.passed;
                    return (
                      <div key={item.id} className="self-end rounded-[1.25rem] bg-hero-wash px-4 py-3 text-[15px]">
                        <span className="font-semibold">
                          {item.submission.kind === "written" ? "Submitted my answer" : passed ? "✓ Submitted: all checks passed" : "Submitted: some checks failed"}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <p key={item.id} className="max-w-[85%] self-end whitespace-pre-wrap rounded-[1.25rem] bg-hero px-4 py-3 text-[16px] text-paper">
                      {item.content}
                    </p>
                  );
                }

                const turn = item.turn!;
                const ex = turn.exercise;
                const exIndex = exerciseItems.findIndex((e) => e.id === item.id);
                const locked = ex && plan === "free" && exIndex >= FREE_TASKS;
                const isLatestEx = item.id === latestExerciseId;

                return (
                  <div key={item.id} className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <span aria-hidden className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-hero text-sm font-bold text-paper">ai</span>
                      <div className="prose-chat min-w-0 text-[16px] leading-relaxed">
                        <ReactMarkdown>{turn.message}</ReactMarkdown>
                      </div>
                    </div>

                    {ex && (
                      <div className="sm:pl-11">
                        {!isLatestEx ? (
                          <p className="rounded-[1.25rem] bg-mint-wash px-4 py-3 font-semibold text-mint">✓ {ex.title}</p>
                        ) : locked ? (
                          <div className="rounded-[1.5rem] border border-line bg-mist p-6 text-center">
                            <p className="text-lg font-bold">{ex.title}</p>
                            <p className="mt-1 text-ink-soft">Your free task in this role is done. Pro unlocks this one and every task after it.</p>
                            <button onClick={() => setPaywallOpen(true)} className="mt-4 rounded-full bg-ink px-6 py-3 font-semibold text-paper">
                              Unlock with Pro
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="prose-chat rounded-[1.25rem] bg-sun/35 px-5 py-4 text-[16px] leading-relaxed">
                              <ReactMarkdown>{ex.task}</ReactMarkdown>
                            </div>
                            {ex.kind === "written" ? (
                              <WrittenTask key={item.id} exercise={ex} disabled={pending} onSubmit={(answer) => send(submissionText(ex, { answer }), { passed: true, kind: "written" })} />
                            ) : (
                              <CodeTask
                                key={item.id}
                                exercise={ex as Exercise & { kind: "python" | "javascript" }}
                                disabled={pending}
                                onSubmit={(code, result) =>
                                  send(submissionText(ex, { code, result }), { passed: !!(result.ok && result.tests?.passed), kind: ex.kind as "python" | "javascript" })
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {item === lastItem && !pending && turn.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-2 sm:pl-11">
                        {turn.quickReplies.map((r) => (
                          <button key={r} onClick={() => send(r)} className="rounded-full border-2 border-hero px-4 py-2 font-semibold text-hero transition hover:bg-hero hover:text-paper">
                            {r}
                          </button>
                        ))}
                      </div>
                    )}

                    {item === lastItem && turn.stage === "done" && (
                      <div className="flex flex-wrap gap-2 sm:pl-11">
                        <button onClick={() => setCatalogOpen(true)} className="rounded-full bg-ink px-5 py-2.5 font-semibold text-paper">Try another role</button>
                        <button onClick={() => setPaywallOpen(true)} className="rounded-full bg-sun px-5 py-2.5 font-semibold">Go deeper with Pro</button>
                        <button onClick={restart} className="rounded-full bg-mist px-5 py-2.5 font-semibold">Start this role again</button>
                      </div>
                    )}
                  </div>
                );
              })}

              {pending && (
                <div className="flex gap-3" aria-live="polite">
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-hero text-sm font-bold text-paper">ai</span>
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
                  <button onClick={() => retry(session)} className="rounded-full bg-rose px-4 py-1.5 text-sm font-semibold text-paper">Retry</button>
                </div>
              )}
              <div ref={bottom} />
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="border-t border-line p-3 sm:p-4"
          >
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-[1.5rem] bg-mist p-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                rows={1}
                placeholder="Ask your mentor anything about this role"
                aria-label="Message your mentor"
                className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 outline-none placeholder:text-ink-soft/70"
              />
              <button type="submit" disabled={pending || !draft.trim()} className="rounded-full bg-hero px-5 py-2.5 font-semibold text-paper transition hover:bg-hero-deep disabled:opacity-40">
                Send
              </button>
            </div>
          </form>
      </main>

      <CatalogModal view={catalogOpen ? "all" : null} onClose={() => setCatalogOpen(false)} />
      <Paywall open={paywallOpen} onClose={() => setPaywallOpen(false)} onUpgrade={upgrade} />
    </div>
  );
}
