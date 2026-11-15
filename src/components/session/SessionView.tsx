"use client";

import { PanelLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GradeResult, PublicTask, Submission, TaskCard } from "@/contracts/task";
import { DesignSceneSchema, type DesignScene } from "@/contracts/workspace";
import { getTask, submitTask } from "@/lib/api";
import type { Profession } from "@/lib/catalog";
import { roleName } from "@/lib/features";
import { getPlan, loadSession, newId, newSession, saveSession, setPlan, type ChatItem, type Session } from "@/lib/sessions";
import type { Stage, TutorTurn } from "@/lib/tutor/schema";
import { CatalogModal } from "../CatalogModal";
import { DotGrid } from "../DotGrid";
import { Flicky } from "../flicky/Flicky";
import { RoleIcon } from "../RoleIcon";
import { CodeWorkspace } from "../workspace/code/CodeWorkspace";
import { DesignWorkspace } from "../workspace/design/DesignWorkspace";
import { TicketPanel } from "../workspace/TicketPanel";
import { WorkspaceShell } from "../workspace/WorkspaceShell";
import { ChatThread, taskCards } from "./ChatThread";
import { Composer } from "./Composer";
import { Paywall } from "./Paywall";
import { Sidebar } from "./Sidebar";

const STAGE_LABELS: Record<Stage, string> = {
  intro: "Interview",
  quiz: "Quiz",
  tasks: "Tasks",
  fit: "Fit check",
  done: "Verdict",
};

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

type OpenTask = { card: TaskCard; number: number; task: PublicTask | null; error: string | null };

// A design draft is kept with the code drafts as one JSON "file".
const SCENE_DRAFT = "scene.json";

function draftScene(files: Record<string, string> | undefined): DesignScene | null {
  const raw = files?.[SCENE_DRAFT];
  if (!raw) return null;
  try {
    const parsed = DesignSceneSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** A grade turns into a mentor turn so the chat history stays one list. */
function gradeTurn(grade: GradeResult, level: string | null): TutorTurn {
  return {
    message: grade.explanation,
    // With no next task (design, the end of a ladder) the learner needs a way to move on to the fit check.
    quickReplies: grade.passed && !grade.next ? ["What's next?"] : [],
    stage: "tasks",
    level,
    profile: null,
    exercise: null,
    taskCompleted: grade.passed,
    task: grade.next,
  };
}

export function SessionView({ profession }: { profession: Profession }) {
  const [session, setSession] = useState<Session>(() => loadSession(profession.slug));
  // A brand-new session is "pending" from the start: the mentor speaks first.
  const [pending, setPending] = useState(() => session.items.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [plan, setPlanState] = useState<"free" | "pro">(() => getPlan());
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const [open, setOpen] = useState<OpenTask | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const sideBottom = useRef<HTMLDivElement>(null);
  // Always the latest session, for callbacks that outlive a render
  // (commit() updates it synchronously; the effect is a safety net).
  const latest = useRef(session);
  useEffect(() => {
    latest.current = session;
  }, [session]);

  const commit = useCallback((next: Session) => {
    saveSession(next);
    latest.current = next;
    setSession(next);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((v) => {
      if (isDesktop()) saveSidebarPref(!v);
      return !v;
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
        commit({
          ...next,
          items: [...next.items, { id: newId(), role: "assistant", content: JSON.stringify(turn), turn }],
          stage: turn.stage,
          level: turn.level ?? next.level,
          tasksCompleted: next.tasksCompleted + (turn.taskCompleted ? 1 : 0),
          mode: data.mode,
        });
      } catch {
        setError("You seem to be offline. Check your connection and send again.");
      } finally {
        setPending(false);
      }
    },
    [commit],
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
    sideBottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session.items.length, pending]);

  // Opening a workspace shows the latest messages in its side chat.
  const openId = open?.card.id;
  useEffect(() => {
    if (openId) sideBottom.current?.scrollIntoView({ block: "end" });
  }, [openId]);

  function retry(next: Session) {
    setError(null);
    setPending(true);
    void ask(next);
  }

  function send(content: string, submission?: ChatItem["submission"]) {
    if (pending || !content.trim()) return;
    const next: Session = { ...latest.current, items: [...latest.current.items, { id: newId(), role: "user", content, submission }] };
    commit(next);
    retry(next);
  }

  function upgrade() {
    setPlan("pro");
    setPlanState("pro");
    setPaywallOpen(false);
  }

  function restart() {
    const fresh = newSession(profession.slug);
    commit(fresh);
    retry(fresh);
  }

  // ---------- tasks and the workspace ----------

  async function openTask(card: TaskCard) {
    const number = taskCards(latest.current.items).findIndex((c) => c.card.id === card.id) + 1 || 1;
    setOpen({ card, number, task: null, error: null });
    try {
      const task = await getTask(card.id);
      setOpen((o) => (o?.card.id === card.id ? { ...o, task } : o));
    } catch (e) {
      const message = e instanceof Error ? e.message : "This task couldn't be loaded.";
      setOpen((o) => (o?.card.id === card.id ? { ...o, error: message } : o));
    }
  }

  const saveDraft = useCallback(
    (taskId: string, files: Record<string, string>) => {
      const s = latest.current;
      commit({ ...s, drafts: { ...s.drafts, [taskId]: files } });
    },
    [commit],
  );

  async function submitWork(taskId: string, work: Pick<Submission, "files" | "scene">) {
    const grade = await submitTask({ taskId, ...work });
    const s = latest.current;
    const checks = grade.checks.filter((c) => c.by === "code");
    const summary = `[Submission] task ${taskId}: ${grade.passed ? "passed" : "failed"} (${checks.filter((c) => c.passed).length}/${checks.length} ${work.scene ? "design-system" : "hidden"} checks)`;
    const turn = gradeTurn(grade, s.level);
    commit({
      ...s,
      items: [
        ...s.items,
        { id: newId(), role: "user", content: summary, submission: { passed: grade.passed, kind: work.scene ? "design" : (open?.card.language ?? "python") } },
        { id: newId(), role: "assistant", content: JSON.stringify(turn), turn, grade },
      ],
      tasksCompleted: s.tasksCompleted + (grade.passed ? 1 : 0),
    });
    return grade;
  }

  const closeWorkspace = useCallback(() => setOpen(null), []);

  // ---------- render ----------

  const usesQuiz = session.items.some((i) => i.turn?.stage === "quiz");
  const stages: Stage[] = usesQuiz ? ["intro", "quiz", "tasks", "fit", "done"] : ["intro", "tasks", "fit", "done"];
  const stageIndex = stages.indexOf(session.stage);

  const threadProps = {
    profession,
    session,
    plan,
    pending,
    error,
    onSend: send,
    onRetry: () => retry(latest.current),
    onOpenTask: (card: TaskCard) => void openTask(card),
    onPaywall: () => setPaywallOpen(true),
    onCatalog: () => setCatalogOpen(true),
    onRestart: restart,
  };

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
      <main className="relative m-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[2rem] bg-paper shadow-[0_24px_60px_-20px_rgba(20,26,39,0.35)]">
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
            <h1 className="truncate text-lg font-bold tracking-[-0.02em]">{roleName(profession)}</h1>
            <ol className="flex flex-wrap gap-x-3 text-sm" aria-label="Session progress">
              {stages.map((s, i) => (
                <li key={s} aria-current={i === stageIndex ? "step" : undefined} className={i < stageIndex ? "text-mint" : i === stageIndex ? "font-semibold text-hero" : "text-ink-soft/60"}>
                  {i < stageIndex ? "✓ " : ""}
                  {STAGE_LABELS[s]}
                </li>
              ))}
            </ol>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <ChatThread {...threadProps} />
            <div ref={bottom} />
          </div>
        </div>

        <Composer disabled={pending} onSend={(text) => send(text)} />
      </main>

      {open && (
        <WorkspaceShell
          card={open.card}
          number={open.number}
          onClose={closeWorkspace}
          assistant={
            open.task && (open.task.code || open.task.design) ? (
              <Flicky key={open.task.card.id} sessionId={`${session.slug}:${session.createdAt}`} taskId={open.task.card.id} workspace={open.task.card.workspace} />
            ) : null
          }
          ticket={open.task ? <TicketPanel task={open.task} number={open.number} /> : <div className="p-6 text-ink-soft">Loading the ticket…</div>}
          chat={
            <>
              <header className="flex items-center gap-3 border-b border-line px-4 py-3">
                <RoleIcon slug={profession.slug} size={32} />
                <div className="min-w-0">
                  <p className="truncate font-bold leading-tight">{roleName(profession)}</p>
                  <p className="text-sm text-ink-soft">Your mentor</p>
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <ChatThread {...threadProps} compact />
                <div ref={sideBottom} />
              </div>
              <Composer compact disabled={pending} onSend={(text) => send(text)} />
            </>
          }
        >
          {open.error ? (
            <div className="grid h-full place-items-center p-8 text-center text-ink">
              <div>
                <p className="text-lg font-bold">This task didn&apos;t load</p>
                <p className="mt-1 text-ink-soft">{open.error}</p>
                <button onClick={() => void openTask(open.card)} className="mt-4 rounded-full bg-hero px-5 py-2.5 font-semibold text-paper transition hover:bg-hero-deep">
                  Try again
                </button>
              </div>
            </div>
          ) : open.task?.code ? (
            <CodeWorkspace
              key={open.task.card.id}
              task={open.task as PublicTask & { code: NonNullable<PublicTask["code"]> }}
              sessionId={`${session.slug}:${session.createdAt}`}
              initialFiles={
                session.drafts?.[open.task.card.id] ?? Object.fromEntries(open.task.code.files.map((f) => [f.path, f.content]))
              }
              onDraft={(files) => saveDraft(open.card.id, files)}
              onSubmit={(files) => submitWork(open.card.id, { files })}
            />
          ) : open.task?.design ? (
            <DesignWorkspace
              key={open.task.card.id}
              task={open.task as PublicTask & { design: NonNullable<PublicTask["design"]> }}
              initialScene={draftScene(session.drafts?.[open.task.card.id]) ?? open.task.design.scene}
              onDraft={(scene) => saveDraft(open.card.id, { [SCENE_DRAFT]: JSON.stringify(scene) })}
              onSubmit={(scene) => submitWork(open.card.id, { scene })}
            />
          ) : open.task ? (
            <div className="grid h-full place-items-center p-8 text-center text-ink-soft">This workspace is on its way. Answer in the chat for now.</div>
          ) : (
            <div className="grid h-full place-items-center text-ink-soft" aria-live="polite">
              Opening the task…
            </div>
          )}
        </WorkspaceShell>
      )}

      <CatalogModal view={catalogOpen ? "all" : null} onClose={() => setCatalogOpen(false)} />
      <Paywall open={paywallOpen} onClose={() => setPaywallOpen(false)} onUpgrade={upgrade} />
    </div>
  );
}
