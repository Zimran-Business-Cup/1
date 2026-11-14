"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getProfession } from "@/lib/catalog";
import { STAGE_LABEL, getPlan, listSessions, subscribe } from "@/lib/sessions";
import { Logo } from "../Logo";
import { RoleIcon } from "../RoleIcon";

const useSessionsKey = () =>
  useSyncExternalStore(
    subscribe,
    () => JSON.stringify(listSessions().map((s) => [s.slug, s.stage, s.tasksCompleted])) + getPlan(),
    () => "",
  );

export function Sidebar({ current, onNewRole, onUpgrade }: { current: string; onNewRole: () => void; onUpgrade: () => void }) {
  useSessionsKey();
  const sessions = typeof window === "undefined" ? [] : listSessions();
  const plan = typeof window === "undefined" ? "free" : getPlan();

  return (
    <div className="flex h-full flex-col gap-6 p-5 text-paper">
      <Logo />
      <button
        onClick={onNewRole}
        className="flex items-center justify-center gap-2 rounded-full bg-paper py-3 font-semibold text-ink shadow-[0_5px_0_0_rgba(13,13,20,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_rgba(13,13,20,0.22)] active:translate-y-0.5 active:shadow-none"
      >
        <span className="text-xl leading-none">+</span> Try another role
      </button>

      <nav aria-label="Your sessions" className="-mx-2 flex-1 overflow-y-auto">
        <p className="px-2 text-sm font-semibold text-paper/75">Your sessions</p>
        <ul className="mt-2 space-y-1">
          {sessions.map((s) => {
            const p = getProfession(s.slug);
            if (!p) return null;
            const active = s.slug === current;
            return (
              <li key={s.slug}>
                <Link
                  href={`/s/${s.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-2 py-2.5 transition ${active ? "bg-paper/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]" : "hover:bg-paper/10"}`}
                >
                  <RoleIcon slug={p.slug} size={38} tone="dark" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block text-sm text-paper/70">
                      {s.stage === "tasks" ? `${s.tasksCompleted} task${s.tasksCompleted === 1 ? "" : "s"} done` : STAGE_LABEL[s.stage]}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rounded-2xl bg-paper/14 p-4 backdrop-blur-sm">
        {plan === "pro" ? (
          <p className="font-semibold">Pro plan <span className="text-sun">●</span></p>
        ) : (
          <>
            <p className="font-semibold">Free plan</p>
            <p className="mt-1 text-sm text-paper/75">First task in every role is free.</p>
            <button onClick={onUpgrade} className="mt-3 w-full rounded-full bg-sun py-2 font-semibold text-ink transition hover:brightness-95">
              Go Pro
            </button>
          </>
        )}
      </div>
    </div>
  );
}
