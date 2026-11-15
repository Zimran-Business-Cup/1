"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight, CreditCard, Mic, MousePointerClick, MessagesSquare, Play } from "lucide-react";
import { VISIBLE_DIRECTIONS, isRoleOpen } from "@/lib/features";
import { listSessions, subscribe } from "@/lib/sessions";
import { CatalogModal, type CatalogView } from "./CatalogModal";
import { DotGrid } from "./DotGrid";
import { Logo } from "./Logo";
import { DirectionIcon } from "./RoleIcon";

const STEPS = [
  { title: "Read the role", text: "What the job involves day to day, the skills it needs, and what it pays across the US, from BLS data." },
  { title: "Tell your mentor about you", text: "A short chat about your job, tools, time and goal sets the level of your first task." },
  { title: "Do real junior tasks", text: "The work a junior gets in week one, in a real editor. Your code runs and gets checked by tests." },
  { title: "Grow into the job", text: "Each new task builds on what you got stuck on last time. A little practice every day takes you to job-ready." },
];

const TOUR = [
  { icon: MousePointerClick, title: "Pick a role", text: "Backend engineer or UI/Product designer. No sign-up." },
  { icon: MessagesSquare, title: "Answer 4 questions", text: "The mentor asks about your job, tools, time and goal, then picks your first task." },
  { icon: Play, title: "Open, Run, Submit", text: "Run checks your work in the browser. Submit runs hidden tests in a sandbox on our server." },
  { icon: Mic, title: "Ask Space out loud", text: "Hold the keys, ask, circle the confusing spot with the mouse, let go. It answers by voice and moves the cursor for you." },
  { icon: CreditCard, title: "Go Pro", text: "Stripe test mode: nothing is charged." },
];

function Key({ children }: { children: string }) {
  return (
    <kbd className="grid h-7 min-w-7 place-items-center rounded-md bg-paper px-1.5 font-sans text-sm font-bold text-ink shadow-[inset_0_-2px_0_rgba(20,26,39,0.2)]">
      {children}
    </kbd>
  );
}

const openSessions = () => listSessions().filter((s) => isRoleOpen(s.slug));

const useSessionCount = () =>
  useSyncExternalStore(subscribe, () => openSessions().length, () => 0);

export function Landing() {
  const [view, setView] = useState<CatalogView | null>(null);
  const sessions = useSessionCount();

  return (
    <main className="flex flex-col gap-2 p-2 sm:gap-3 sm:p-3">
      {/* Hero */}
      {/* Fills the first screen exactly, so the next section never peeks in under the fold. */}
      <section className="relative flex min-h-[calc(100svh-1rem)] flex-col overflow-hidden rounded-[var(--radius-panel)] bg-hero px-5 py-6 text-paper sm:min-h-[calc(100svh-1.5rem)] sm:px-10">
        <DotGrid />
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-4">
          <Logo />
          <nav className="ml-auto flex items-center gap-3 text-lg font-medium sm:gap-6">
            <a href="#tour" className="hidden whitespace-nowrap rounded-full bg-paper/15 px-5 py-2.5 text-lg text-paper transition hover:bg-paper/25 sm:inline-flex">
              2-minute tour
            </a>
            {sessions > 0 && (
              <Link href={`/s/${openSessions()[0].slug}`} className="whitespace-nowrap rounded-full bg-paper px-4 py-2 text-base text-hero transition hover:bg-steel hover:text-ink sm:px-5 sm:py-2.5 sm:text-lg">
                My sessions ({sessions})
              </Link>
            )}
          </nav>
        </header>

        <div className="relative z-10 mx-auto my-auto w-full max-w-5xl py-12 text-center sm:py-16">
          <h1 className="animate-rise text-[clamp(2.75rem,8.4vw,7.25rem)] font-bold leading-[0.92] tracking-[-0.055em]">
            Try a new career
            <br />
            before you commit
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-paper/85 sm:text-xl">
            Pick a role, see what it pays, and do the real tasks a junior does in week one. An AI mentor checks your work and tells you honestly if it fits.
          </p>

          <ul className="mt-12 flex flex-wrap justify-center gap-3">
            {VISIBLE_DIRECTIONS.map((d, i) => (
              <li key={d.id} className="dir-pill-in" style={{ animationDelay: `${0.35 + i * 0.09}s` }}>
                <button onClick={() => setView(d.id)} className="dir-pill">
                  <DirectionIcon id={d.id} size={46} className="dir-pill__icon" />
                  <span>{d.name}</span>
                  <span aria-hidden className="dir-pill__arrow">
                    <ArrowRight size={22} strokeWidth={2.2} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* A guided path for judges and first-time visitors */}
      <section id="tour" className="scroll-mt-3 rounded-[var(--radius-panel)] bg-ink px-5 py-16 text-paper sm:px-10 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-paper/60">For judges and first-time visitors</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-bold leading-[1] tracking-[-0.045em] sm:text-6xl">See everything in 2 minutes</h2>
          <ol className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {TOUR.map((s, i) => (
              <li key={s.title} className="flex flex-col rounded-[1.75rem] bg-paper/[0.07] p-5">
                <span className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-hero text-lg font-bold">{i + 1}</span>
                  <s.icon size={22} aria-hidden className="text-paper/70" />
                </span>
                <h3 className="mt-5 text-xl font-bold tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-paper/70">{s.text}</p>
                {s.icon === Mic && (
                  <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-paper/70">
                    <span className="flex items-center gap-1.5">
                      <Key>⌃</Key>
                      <Key>⌥</Key>
                      <Key>X</Key>
                      <span className="ml-0.5">Mac</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Key>Ctrl</Key>
                      <Key>Alt</Key>
                      <Key>X</Key>
                      <span className="ml-0.5">Windows</span>
                    </span>
                  </p>
                )}
                {s.icon === CreditCard && (
                  <p className="mt-4 rounded-xl bg-paper/10 px-3 py-2 text-sm leading-relaxed">
                    <span className="whitespace-nowrap font-mono text-sm font-semibold">4242 4242 4242 4242</span>
                    <br />
                    <span className="text-paper/70">any future date, any CVC</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/s/backend-engineer" className="flex items-center gap-2 rounded-full bg-paper px-6 py-3.5 text-lg font-semibold text-ink transition hover:bg-steel">
              Start as Backend engineer <ArrowRight size={20} aria-hidden />
            </Link>
            <Link href="/s/product-designer" className="flex items-center gap-2 rounded-full bg-paper/15 px-6 py-3.5 text-lg font-semibold transition hover:bg-paper/25">
              Start as UI/Product designer <ArrowRight size={20} aria-hidden />
            </Link>
            <p className="text-sm text-paper/60">Best in Chrome on a laptop with a microphone.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="rounded-[var(--radius-panel)] bg-paper px-5 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl text-4xl font-bold leading-[1] tracking-[-0.045em] sm:text-6xl">
            Master a new profession with us
          </h2>
          <ol className="mt-12 grid gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-[1.75rem] bg-mist p-6">
                <span className="grid size-10 place-items-center rounded-full bg-hero text-lg font-bold text-paper">{i + 1}</span>
                <h3 className="mt-6 text-xl font-bold tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="rounded-[var(--radius-panel)] bg-steel px-5 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="text-4xl font-bold leading-[1] tracking-[-0.045em] sm:text-6xl">Start free. Go Pro when a role clicks.</h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink/75">
              Every role gives you the full description, pay data, a short interview with your mentor and your first real task for free. Pro unlocks every task, unlimited roles, and the path to job-ready.
            </p>
          </div>
          <div className="rounded-[2rem] bg-paper p-8">
            <p className="text-lg font-semibold">1ry-space Pro</p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-6xl font-bold tracking-[-0.05em]">$20</span>
              <span className="text-lg text-ink-soft">first month</span>
            </p>
            <p className="mt-1 text-ink-soft">Then $35 a month. Cancel anytime in one click.</p>
            <ul className="mt-6 space-y-2 text-[17px]">
              {["Every task in every role", "Unlimited sessions side by side", "Personal path to job-ready", "Portfolio project reviewed by your mentor"].map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="text-mint">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => setView("all")} className="mt-8 w-full rounded-full bg-ink py-4 text-lg font-semibold text-paper transition hover:bg-ink/85">
              Pick a role to start free
            </button>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 px-6 py-8 text-paper/60">
        <Logo />
        <p className="text-sm">Pay data: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics.</p>
      </footer>

      <CatalogModal view={view} onClose={() => setView(null)} />
    </main>
  );
}
