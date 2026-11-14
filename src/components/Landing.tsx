"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
import { DIRECTIONS, PROFESSIONS } from "@/lib/catalog";
import { listSessions, subscribe } from "@/lib/sessions";
import { CatalogModal, type CatalogView } from "./CatalogModal";
import { DotGrid } from "./DotGrid";
import { Logo } from "./Logo";
import { DirectionIcon } from "./RoleIcon";

const STEPS = [
  { title: "Read the role", text: "What the job involves day to day, the skills it needs, and what it pays across the US, from BLS data." },
  { title: "Take a 1-minute quiz", text: "Three quick questions set your starting level, so tasks are neither too easy nor too hard." },
  { title: "Do real junior tasks", text: "The work a junior gets in week one. Code runs right in the chat; written tasks get graded like a hiring manager would." },
  { title: "Decide if it's for you", text: "Your mentor gives an honest fit verdict. Try another role in a new session and compare." },
];

const useSessionCount = () =>
  useSyncExternalStore(subscribe, () => listSessions().length, () => 0);

export function Landing() {
  const [view, setView] = useState<CatalogView | null>(null);
  const sessions = useSessionCount();

  return (
    <main className="flex flex-col gap-2 p-2 sm:gap-3 sm:p-3">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[var(--radius-panel)] bg-hero px-5 pb-16 pt-6 text-paper sm:px-10 sm:pb-24">
        <DotGrid />
        <header className="relative z-10 mx-auto flex max-w-6xl items-center gap-4">
          <Logo />
          <nav className="ml-auto flex items-center gap-6 text-lg font-medium">
            {sessions > 0 && (
              <Link href={`/s/${listSessions()[0].slug}`} className="rounded-full bg-paper px-5 py-2.5 text-hero transition hover:bg-sun hover:text-ink">
                My sessions ({sessions})
              </Link>
            )}
          </nav>
        </header>

        <div className="relative z-10 mx-auto mt-16 max-w-5xl text-center sm:mt-24">
          <h1 className="animate-rise text-[clamp(2.75rem,8.4vw,7.25rem)] font-bold leading-[0.92] tracking-[-0.055em]">
            Try a new career
            <br />
            before you commit
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-paper/85 sm:text-xl">
            Pick a role, see what it pays, and do the real tasks a junior does in week one. An AI mentor checks your work and tells you honestly if it fits.
          </p>

          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 text-center">
            {[
              [`${PROFESSIONS.length} roles`, "in tech, design and management"],
              ["Real tasks", "graded the way a hiring manager would"],
              ["$0 to start", "no card, no sign-up"],
            ].map(([big, small]) => (
              <div key={big}>
                <dt className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{big}</dt>
                <dd className="mt-1 text-sm text-paper/75 sm:text-base">{small}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-12 flex flex-wrap justify-center gap-3">
            {DIRECTIONS.map((d, i) => (
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
            Twenty minutes in a role tells you more than a month of reading about it
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
      <section id="pricing" className="rounded-[var(--radius-panel)] bg-sun px-5 py-16 sm:px-10 sm:py-24">
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
