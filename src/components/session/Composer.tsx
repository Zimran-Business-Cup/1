"use client";

import { ArrowUp } from "lucide-react";
import { useState } from "react";

/** The message box under a chat. Enter sends, Shift+Enter adds a line. */
export function Composer({ disabled, compact = false, onSend }: { disabled: boolean; compact?: boolean; onSend: (text: string) => void }) {
  const [draft, setDraft] = useState("");

  function submit() {
    if (disabled || !draft.trim()) return;
    onSend(draft.trim());
    setDraft("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={`border-t border-line ${compact ? "p-3" : "p-3 sm:p-4"}`}
    >
      <div className={`mx-auto flex items-end gap-2 rounded-[1.5rem] bg-mist p-2 ${compact ? "" : "max-w-3xl"}`}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={compact ? "Ask your mentor" : "Ask your mentor anything about this role"}
          aria-label="Message your mentor"
          className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 outline-none placeholder:text-ink-soft/70"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          aria-label="Send"
          className={`grid place-items-center rounded-full bg-hero font-semibold text-paper transition hover:bg-hero-deep disabled:opacity-40 ${compact ? "size-11" : "h-11 px-5"}`}
        >
          {compact ? <ArrowUp size={20} strokeWidth={2.4} /> : "Send"}
        </button>
      </div>
    </form>
  );
}
