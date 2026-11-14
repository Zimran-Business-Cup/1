"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/tutor/schema";

export function WrittenTask({ exercise, disabled, onSubmit }: { exercise: Exercise; disabled: boolean; onSubmit: (answer: string) => void }) {
  const [answer, setAnswer] = useState("");
  const words = answer.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-line bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="font-semibold">{exercise.title}</span>
        <span className="rounded-full bg-mist px-3 py-1 text-sm font-semibold text-ink-soft">Written task</span>
      </div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={disabled}
        rows={6}
        placeholder="Write your answer the way you would at work."
        aria-label={`Answer for ${exercise.title}`}
        className="block w-full resize-y px-5 py-4 text-[16px] leading-relaxed outline-none placeholder:text-ink-soft/60"
      />
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <span className="text-sm text-ink-soft">{words} words</span>
        <button
          onClick={() => onSubmit(answer.trim())}
          disabled={disabled || words === 0}
          className="rounded-full bg-hero px-5 py-2 font-semibold text-paper transition hover:bg-hero-deep disabled:opacity-50"
        >
          Submit answer
        </button>
      </div>
    </div>
  );
}
