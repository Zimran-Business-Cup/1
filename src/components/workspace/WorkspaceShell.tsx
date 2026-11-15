"use client";

import { ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { TaskCard } from "@/contracts/task";
import { introFor } from "@/lib/intros";
import { DotGrid } from "../DotGrid";

type Pane = "ticket" | "tool" | "chat";

const TOOL_LABEL = { code: "Code", design: "Design", board: "Board" } as const;

// Side panels start open only where the tool still gets enough room.
const wide = (px: number) => typeof window !== "undefined" && window.matchMedia(`(min-width: ${px}px)`).matches;

function PanelToggle({ open, onClick, icon, label }: { open: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={open}
      className={`hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition lg:flex ${open ? "bg-paper text-ink" : "bg-paper/15 text-paper hover:bg-paper/25"}`}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Full-screen task workspace: the ticket on the left, the tool in the middle,
 * the session chat on the right. Both side panels collapse so the tool can
 * take the whole width. Esc or "Back to chat" returns to the chat.
 */
export function WorkspaceShell({
  card,
  number,
  ticket,
  chat,
  onClose,
  assistant,
  children,
}: {
  card: TaskCard;
  number: number;
  ticket: ReactNode;
  chat: ReactNode;
  onClose: () => void;
  /** Shown in the header next to the panel toggles (Flicky). */
  assistant?: ReactNode;
  children: ReactNode;
}) {
  // A task with a lesson opens with the ticket showing, so the learner reads it first.
  const [ticketOpen, setTicketOpen] = useState(() => wide(1440) || (!!introFor(card) && wide(1024)));
  const [chatOpen, setChatOpen] = useState(() => wide(1180));
  const [pane, setPane] = useState<Pane>("tool");
  const root = useRef<HTMLDivElement>(null);

  // Esc closes the workspace unless a dialog (paywall, catalog) or Flicky is on top.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open], [data-flicky-open]")) onClose();
    };
    window.addEventListener("keydown", onKey);
    root.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const show = (p: Pane) => (pane === p ? "flex" : "hidden");

  return (
    <div ref={root} data-snapshot-root tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Task ${number}: ${card.title}`} className="ws fixed inset-0 z-40 flex flex-col bg-hero outline-none">
      <DotGrid subtle />

      <header className="relative flex items-center gap-3 px-3 py-3 text-paper sm:px-4">
        <button onClick={onClose} className="flex shrink-0 items-center gap-2 rounded-full bg-paper px-4 py-2 font-semibold text-ink shadow-[0_4px_0_0_rgba(20,26,39,0.18)] transition hover:-translate-y-0.5">
          <ArrowLeft size={18} aria-hidden /> <span className="hidden sm:inline">Back to chat</span>
        </button>
        {/* On phones the title lives in the Ticket tab, so the header keeps room for the tabs */}
        <div className="hidden min-w-0 sm:block">
          <p className="text-sm font-semibold text-paper/75">Task {number}</p>
          <h1 className="truncate text-lg font-bold leading-tight tracking-[-0.02em]">{card.title}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">{assistant}</div>

        {/* Phones and tablets: one pane at a time */}
        <div role="tablist" aria-label="Workspace panes" className="flex rounded-full bg-paper/15 p-1 lg:hidden">
          {(["ticket", "tool", "chat"] as Pane[]).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={pane === p}
              onClick={() => setPane(p)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${pane === p ? "bg-paper text-ink" : "text-paper"}`}
            >
              {p === "ticket" ? "Ticket" : p === "tool" ? TOOL_LABEL[card.workspace] : "Chat"}
            </button>
          ))}
        </div>

        {/* Desktop: toggle the side panels */}
        <div className="hidden items-center gap-2 lg:flex">
          <PanelToggle open={ticketOpen} onClick={() => setTicketOpen((v) => !v)} icon={<FileText size={17} aria-hidden />} label="Ticket" />
          <PanelToggle open={chatOpen} onClick={() => setChatOpen((v) => !v)} icon={<MessageSquare size={17} aria-hidden />} label="Mentor" />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <aside
          aria-label="Ticket"
          inert={!ticketOpen && wide(1024)}
          className={`ws-col ws-col--1 ws-side ws-ticket ${ticketOpen ? "ws-side--open" : ""} ${show("ticket")} min-h-0 flex-1 overflow-hidden rounded-[1.75rem] bg-paper lg:flex lg:flex-none`}
        >
          <div className="ws-side__inner flex h-full min-h-0 flex-col">{ticket}</div>
        </aside>

        <main className={`ws-col ws-col--2 ${show("tool")} min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-paper shadow-[0_24px_60px_-20px_rgba(20,26,39,0.35)] lg:flex`}>
          {children}
        </main>

        <aside
          aria-label="Mentor chat"
          inert={!chatOpen && wide(1024)}
          className={`ws-col ws-col--3 ws-side ws-chat ${chatOpen ? "ws-side--open" : ""} ${show("chat")} min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-paper lg:flex lg:flex-none`}
        >
          <div className="ws-side__inner flex h-full min-h-0 flex-col">{chat}</div>
        </aside>
      </div>
    </div>
  );
}
