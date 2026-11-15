"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { DirectionId } from "@/lib/catalog";
import { VISIBLE_DIRECTIONS, VISIBLE_PROFESSIONS, isRoleOpen, roleName } from "@/lib/features";
import { RoleIcon } from "./RoleIcon";

export type CatalogView = DirectionId | "all";

const usd = (n: number) => `$${Math.round(n / 1000)}k`;

export function CatalogModal({ view, onClose }: { view: CatalogView | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (view) {
      // A dialog restored from a cached page can come back open but not modal.
      if (el.open && !el.matches(":modal")) el.close();
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [view]);

  const direction = view && view !== "all" ? VISIBLE_DIRECTIONS.find((d) => d.id === view) : null;
  const roles = direction ? VISIBLE_PROFESSIONS.filter((p) => p.direction === direction.id) : VISIBLE_PROFESSIONS;

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      aria-label={direction ? direction.name : "All roles"}
      className="m-auto w-[min(1120px,calc(100vw-1.5rem))] max-h-[calc(100vh-1.5rem)] rounded-[2rem] bg-paper p-0 text-ink backdrop:bg-ink/70 backdrop:backdrop-blur-sm"
    >
      {view && (
        <div className="p-6 sm:p-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-4xl font-bold tracking-[-0.035em] sm:text-6xl">{direction ? direction.name : "All roles"}</h2>
              <p className="mt-3 max-w-xl text-lg text-ink-soft">
                {direction ? direction.blurb : "Every role opens its own session. Try two and compare how they felt."}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid size-14 shrink-0 place-items-center rounded-full bg-mist text-2xl transition hover:bg-line"
            >
              ✕
            </button>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Open roles first, then the ones that are coming soon */}
            {[...roles].sort((a, b) => Number(isRoleOpen(b.slug)) - Number(isRoleOpen(a.slug))).map((p) => {
              const open = isRoleOpen(p.slug);
              const body = (
                <>
                  <span className="flex items-start justify-between gap-3">
                    <RoleIcon slug={p.slug} size={64} />
                    {!open && <span className="rounded-full bg-paper px-3 py-1.5 text-sm font-semibold text-ink-soft">Coming soon</span>}
                  </span>
                  <span className="mt-6 text-sm text-ink-soft">Role</span>
                  <span className="mt-1 text-2xl font-bold leading-tight tracking-[-0.02em]">{roleName(p)}</span>
                  <span className="mt-2 text-[15px] leading-snug text-ink-soft">{p.brief.summary}</span>
                  <span className="mt-auto flex flex-wrap gap-2 pt-6 text-sm font-semibold">
                    <span className="rounded-full bg-paper px-3 py-1.5">{p.practice === "written" ? "Written tasks" : p.practice === "python" ? "Python tasks" : "JavaScript tasks"}</span>
                    {p.pay?.percentiles.median != null && (
                      <span className="rounded-full bg-paper px-3 py-1.5">Median {usd(p.pay.percentiles.median)}/yr</span>
                    )}
                  </span>
                </>
              );
              return (
                <li key={p.slug}>
                  {open ? (
                    <Link
                      href={`/s/${p.slug}`}
                      onClick={onClose}
                      className="role-tile flex h-full flex-col rounded-[1.75rem] bg-mist p-6 transition hover:bg-hero-wash focus-visible:bg-hero-wash"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div aria-disabled="true" className="flex h-full flex-col rounded-[1.75rem] bg-mist p-6 opacity-55">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </dialog>
  );
}
