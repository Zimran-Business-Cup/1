"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
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
          <nav className="ml-auto flex items-center gap-6 text-lg font-medium">
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
              Every role gives you the full description, pay data, the level quiz and your first real task for free. Pro unlocks every task, unlimited roles, and the path to job-ready.
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
