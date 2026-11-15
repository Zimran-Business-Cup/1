import { BookOpen, Circle, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { PublicTask } from "@/contracts/task";
import { introFor } from "@/lib/intros";

const LANGUAGE = { python: "Python", javascript: "JavaScript" } as const;

/** The left column of a workspace: who asks, what they need, and how it will be checked. */
export function TicketPanel({ task, number }: { task: PublicTask; number: number }) {
  const { card, ticket } = task;
  const intro = introFor(card);
  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <p className="flex items-center gap-2">
        <span className="rounded-lg bg-hero-wash px-2.5 py-1 font-mono text-[13px] font-semibold text-hero-deep">{card.id}</span>
        <span className="text-sm font-semibold text-ink-soft">Task {number}</span>
      </p>
      <h2 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.03em]">{card.title}</h2>
      <p className="mt-1 text-sm font-semibold text-ink-soft">From {ticket.from}</p>

      <div className="prose-chat mt-5 text-[16px] leading-relaxed">
        <ReactMarkdown>{ticket.body}</ReactMarkdown>
      </div>

      {intro && (
        <section
          data-anchor="ticket.intro"
          data-anchor-label="Before you start: the short lesson for this task, in the ticket"
          data-anchor-role="region"
          aria-labelledby="ticket-intro"
          className="mt-6 rounded-2xl border border-line p-4"
        >
          <h3 id="ticket-intro" className="flex items-center gap-2 font-bold">
            <BookOpen size={16} aria-hidden className="text-hero" /> Before you start
          </h3>
          <div className="prose-chat mt-3 text-[15px] leading-relaxed">
            <ReactMarkdown>{intro}</ReactMarkdown>
          </div>
        </section>
      )}

      {ticket.requirements.length > 0 && (
        <section data-anchor="ticket.requirements" data-anchor-label="Done when: the list of requirements in the ticket" data-anchor-role="region" className="mt-6" aria-labelledby="ticket-reqs">
          <h3 id="ticket-reqs" className="font-bold">
            Done when
          </h3>
          <ul className="mt-2 space-y-2 text-[15px] leading-snug">
            {ticket.requirements.map((r) => (
              <li key={r} className="flex gap-2.5">
                <Circle size={14} className="mt-[0.3em] shrink-0 text-hero" aria-hidden strokeWidth={2.4} />
                <span className="prose-chat">
                  <ReactMarkdown>{r}</ReactMarkdown>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="mt-auto flex flex-wrap gap-2 pt-8 text-sm font-semibold">
        {card.language && <li className="rounded-full bg-mist px-3 py-1">{LANGUAGE[card.language]}</li>}
        <li className="rounded-full bg-mist px-3 py-1">Junior</li>
        <li className="flex items-center gap-1 rounded-full bg-mist px-3 py-1">
          <Clock size={14} aria-hidden /> ~{card.minutes} min
        </li>
      </ul>
    </div>
  );
}
