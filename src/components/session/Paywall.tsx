"use client";

import { useEffect, useRef } from "react";

const PERKS = ["Every task in every role", "Unlimited sessions side by side", "Personal path to job-ready", "Portfolio project reviewed by your mentor"];

interface PaywallProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  busy?: boolean;
  error?: string | null;
}

export function Paywall({ open, onClose, onUpgrade, busy = false, error = null }: PaywallProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      aria-labelledby="paywall-title"
      className="m-auto w-[min(520px,calc(100vw-1.5rem))] rounded-[2rem] bg-paper p-0 text-ink backdrop:bg-ink/70 backdrop:backdrop-blur-sm"
    >
      <div className="bg-steel px-8 pb-8 pt-10">
        <h2 id="paywall-title" className="text-4xl font-bold leading-[1] tracking-[-0.045em]">Keep going with Pro</h2>
        <p className="mt-3 text-lg text-ink/75">You finished your free task. Pro unlocks the rest of this role and every other one.</p>
      </div>
      <div className="px-8 py-7">
        <p className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-[-0.05em]">$20</span>
          <span className="text-lg text-ink-soft">first month</span>
        </p>
        <p className="mt-1 text-ink-soft">Then $35 a month. Cancel anytime in one click.</p>
        <ul className="mt-5 space-y-2">
          {PERKS.map((f) => (
            <li key={f} className="flex gap-3">
              <span className="text-mint">✓</span>
              {f}
            </li>
          ))}
        </ul>
        <button
          onClick={onUpgrade}
          disabled={busy}
          className="mt-7 w-full rounded-full bg-ink py-4 text-lg font-semibold text-paper transition hover:bg-ink/85 disabled:opacity-60"
        >
          {busy ? "Opening checkout…" : "Start Pro for $20"}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-red-600">
            {error}
          </p>
        )}
        <p className="mt-3 text-center text-sm text-ink-soft">Stripe test mode: no real card is charged. Pay with 4242 4242 4242 4242, any future date and CVC.</p>
        <button onClick={onClose} className="mt-2 w-full rounded-full py-3 font-semibold text-ink-soft hover:bg-mist">
          Not now
        </button>
      </div>
    </dialog>
  );
}
