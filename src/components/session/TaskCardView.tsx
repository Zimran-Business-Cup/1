"use client";

import { ArrowRight, BookOpen, Check, ChevronDown, Clock, CodeXml, LayoutDashboard, Lock, PenTool, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { TaskCard } from "@/contracts/task";
import type { WorkspaceKind } from "@/contracts/workspace";
import { introFor } from "@/lib/intros";

const TOOL: Record<WorkspaceKind, { icon: LucideIcon; label: string }> = {
  code: { icon: CodeXml, label: "Code editor" },
  design: { icon: PenTool, label: "Design canvas" },
  board: { icon: LayoutDashboard, label: "Sprint board" },
};

const LANGUAGE = { python: "Python", javascript: "JavaScript" } as const;

export type TaskCardState = "ready" | "locked" | "passed";

/** The task the mentor drops into the chat. Open expands the full-screen workspace. */
export function TaskCardView({
  card,
  number,
  state,
  compact = false,
  onOpen,
  onUnlock,
}: {
  card: TaskCard;
  number: number;
  state: TaskCardState;
  compact?: boolean;
  onOpen: () => void;
  onUnlock: () => void;
}) {
  const tool = TOOL[card.workspace];
  const Icon = tool.icon;
  // The lesson starts open on a task that's waiting to be done, so it's read before Open.
  const [introOpen, setIntroOpen] = useState(state === "ready" && !compact);
  const introId = useId();
  const intro = introFor(card);

  return (
    <article
      className={`task-card animate-rise overflow-hidden rounded-[1.5rem] border bg-paper ${state === "passed" ? "border-mint/40" : "border-line"} ${compact ? "p-4" : "p-5"}`}
      aria-label={`Task ${number}: ${card.title}`}
    >
      <div className="flex items-start gap-4">
        <span aria-hidden className={`grid shrink-0 place-items-center rounded-2xl bg-hero text-paper ${compact ? "size-10" : "size-12"}`}>
          <Icon size={compact ? 20 : 24} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-hero">Task {number}</p>
          <h3 className={`font-bold leading-tight tracking-[-0.02em] ${compact ? "text-lg" : "text-xl"}`}>{card.title}</h3>
          <p className="mt-1 text-[15px] leading-snug text-ink-soft">{card.summary}</p>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
            <li className="rounded-full bg-mist px-3 py-1">{tool.label}</li>
            {card.language && <li className="rounded-full bg-mist px-3 py-1">{LANGUAGE[card.language]}</li>}
            <li className="flex items-center gap-1 rounded-full bg-mist px-3 py-1">
              <Clock size={14} aria-hidden /> ~{card.minutes} min
            </li>
          </ul>
        </div>
      </div>

      {intro && (
        <div className="mt-4 rounded-2xl border border-line">
          <button
            onClick={() => setIntroOpen((v) => !v)}
            aria-expanded={introOpen}
            aria-controls={introId}
            className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left font-semibold transition hover:bg-mist/60"
          >
            <BookOpen size={17} aria-hidden className="shrink-0 text-hero" />
            Before you start
            <span className="font-normal text-ink-soft">· quick lesson</span>
            <ChevronDown size={18} aria-hidden className={`ml-auto shrink-0 text-ink-soft transition ${introOpen ? "rotate-180" : ""}`} />
          </button>
          {introOpen && (
            <div id={introId} className="prose-chat border-t border-line px-4 py-4 text-[15px] leading-relaxed">
              <ReactMarkdown>{intro}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {state === "locked" ? (
          <button onClick={onUnlock} className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-semibold text-paper transition hover:bg-ink/85">
            <Lock size={16} aria-hidden /> Unlock with Pro
          </button>
        ) : (
          <button onClick={onOpen} className="task-card__open flex items-center gap-2 rounded-full bg-hero px-5 py-2.5 font-semibold text-paper transition hover:bg-hero-deep">
            {state === "passed" ? "Open again" : "Open"}
            <ArrowRight size={18} aria-hidden className="task-card__arrow" />
          </button>
        )}
        {state === "passed" && (
          <span className="flex items-center gap-1.5 font-semibold text-mint">
            <Check size={18} aria-hidden /> Passed
          </span>
        )}
      </div>
    </article>
  );
}
