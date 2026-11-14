"use client";

import { useEffect, useState } from "react";
import type { Profession } from "@/lib/catalog";
import { DotGrid } from "../DotGrid";
import { RoleIcon } from "../RoleIcon";

const k = (n: number) => `$${Math.round(n / 1000)}k`;

/** Counts from 0 up to `target` with an ease-out, once, when the card appears. */
function useCountUp(target: number, ms = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

function Bullet() {
  return (
    <span aria-hidden className="mt-[0.45em] grid size-4 shrink-0 place-items-center rounded-[0.35rem] bg-hero-wash">
      <span className="size-1.5 rounded-full bg-hero" />
    </span>
  );
}

/** The role at a glance, shown as the mentor's first message in a session. */
export function RoleBrief({ profession: p }: { profession: Profession }) {
  const pay = p.pay;
  const pc = pay?.percentiles;
  const median = useCountUp(pc?.median ?? 0);
  const low = pc?.p10 ?? null;
  const high = pc?.p90 ?? null;
  const pos = (v: number | null) => (v != null && low != null && high != null ? ((v - low) / (high - low)) * 100 : 0);
  const topIndustry = pay ? Math.max(...pay.industries.map((i) => i.median)) : 0;

  return (
    <article className="animate-rise space-y-3" aria-label={`About the ${p.name} role`}>
      {/* The role and its pay: the hero of the card */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-hero p-6 text-paper sm:p-8">
        <DotGrid subtle />
        <div className="relative">
          <div className="flex items-center gap-3">
            <RoleIcon slug={p.slug} size={44} tone="dark" />
            <span className="text-[15px] font-semibold text-paper/75">The role you&apos;re test-driving</span>
          </div>
          <h2 className="mt-5 text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[0.95] tracking-[-0.05em]">{p.name}</h2>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-paper/80">{p.brief.summary}</p>

          {pay && pc?.median != null && low != null && high != null && (
            <div className="mt-9">
              <p className="text-[15px] font-semibold text-paper/75">What it pays in the US</p>
              <div className="mt-1 flex flex-wrap items-end gap-x-10 gap-y-4">
                <p>
                  <span className="block text-[clamp(3.5rem,8vw,5.5rem)] font-extrabold leading-none tracking-[-0.05em] text-sun">
                    ${median.toLocaleString("en-US")}
                  </span>
                  <span className="mt-1 block text-paper/75">a year, typical (median)</span>
                </p>
                <dl className="flex gap-8 pb-1.5">
                  <div>
                    <dt className="text-sm text-paper/70">To start</dt>
                    <dd className="text-3xl font-bold tracking-[-0.04em]">{k(low)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-paper/70">Top 10%</dt>
                    <dd className="text-3xl font-bold tracking-[-0.04em]">{k(high)}</dd>
                  </div>
                </dl>
              </div>

              <div className="relative mt-7 h-3 rounded-full bg-paper/15" aria-hidden>
                {pc.p25 != null && pc.p75 != null && (
                  <span
                    className="bar-grow absolute inset-y-0 rounded-full bg-paper/50"
                    style={{ left: `${pos(pc.p25)}%`, width: `${pos(pc.p75) - pos(pc.p25)}%` }}
                  />
                )}
                <span
                  className="pop-in absolute top-1/2 size-6 rounded-full border-4 border-hero bg-sun"
                  style={{ left: `${pos(pc.median)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-sm text-paper/70">
                <span>{k(low)}</span>
                <span>Middle half earns {k(pc.p25 ?? low)}–{k(pc.p75 ?? high)}</span>
                <span>{k(high)}</span>
              </div>

              {pay.metros.length > 0 && (
                <div className="mt-7 flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[15px] font-semibold text-paper/75">Pays most in</span>
                  {pay.metros.map((m) => (
                    <span key={m.name} className="rounded-full bg-paper/12 px-3.5 py-1.5 text-[15px] backdrop-blur-sm">
                      {m.name} <b className="ml-1 font-bold">{k(m.median)}</b>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* What the job is and how to get it */}
      <section className="rounded-[1.75rem] border border-line bg-paper p-6 sm:p-8">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-xl font-bold tracking-[-0.02em]">The work</h3>
            <ul className="mt-3 space-y-2.5 text-[16px] leading-snug">
              {p.brief.responsibilities.map((r) => (
                <li key={r} className="flex gap-3">
                  <Bullet />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-[-0.02em]">To get hired</h3>
            <ul className="mt-3 space-y-2.5 text-[16px] leading-snug">
              {p.brief.qualifications.map((r) => (
                <li key={r} className="flex gap-3">
                  <Bullet />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {pay && pay.industries.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold tracking-[-0.02em]">Who pays best</h3>
            <ul className="mt-3 space-y-3">
              {pay.industries.map((m, i) => (
                <li key={m.name}>
                  <div className="flex justify-between gap-3 text-[15px]">
                    <span className="text-ink-soft">{m.name}</span>
                    <span className="font-bold">{k(m.median)}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-mist">
                    <span
                      className="bar-grow block h-full rounded-full bg-hero"
                      style={{ width: `${(m.median / topIndustry) * 100}%`, animationDelay: `${0.3 + i * 0.12}s` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 border-t border-line pt-5">
          <ul className="flex flex-wrap gap-2" aria-label="Skills">
            {p.brief.skills.map((s) => (
              <li key={s} className="rounded-full bg-mist px-3.5 py-1.5 text-sm font-semibold">{s}</li>
            ))}
          </ul>
          {pay && (
            <p className="mt-4 text-xs leading-relaxed text-ink-soft">
              Pay: BLS OEWS {pay.year}, {pay.occupation} ({pay.soc}). Base wages, without bonuses or equity.{pay.proxy ? ` ${pay.proxy}` : ""}{" "}
              <a href={pay.source} target="_blank" rel="noreferrer" className="underline">Source</a>
            </p>
          )}
        </div>
      </section>
    </article>
  );
}
