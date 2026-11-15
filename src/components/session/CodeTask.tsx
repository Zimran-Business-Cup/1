"use client";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import { runCode, warmUp, type RunResult } from "@/lib/runner";
import type { Exercise } from "@/lib/tutor/schema";

interface Props {
  exercise: Exercise & { kind: "python" | "javascript" };
  disabled: boolean;
  onSubmit: (code: string, result: RunResult) => void;
}

export function CodeTask({ exercise, disabled, onSubmit }: Props) {
  const [code, setCode] = useState(exercise.starterCode);
  const [busy, setBusy] = useState<"run" | "check" | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  useEffect(() => warmUp(exercise.kind), [exercise.kind]);

  async function execute(mode: "run" | "check") {
    setBusy(mode);
    const r = await runCode(exercise.kind, code, mode === "check" ? exercise.tests : "");
    setResult(r);
    setBusy(null);
    if (mode === "check") onSubmit(code, r);
  }

  const label = exercise.kind === "python" ? "Python" : "JavaScript";
  const testState = result?.tests ?? null;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-line bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="font-semibold">{exercise.title}</span>
        <span className="rounded-full bg-mist px-3 py-1 text-sm font-semibold text-ink-soft">{label}</span>
      </div>
      <CodeMirror
        value={code}
        onChange={setCode}
        theme="dark"
        extensions={[exercise.kind === "python" ? python() : javascript()]}
        basicSetup={{ foldGutter: false, highlightActiveLine: false }}
        minHeight="160px"
        maxHeight="360px"
        aria-label={`${label} editor`}
        editable={!disabled}
        style={{ fontFamily: "var(--font-mono)", fontSize: 14 }}
      />
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
        <button
          onClick={() => execute("run")}
          disabled={!!busy || disabled}
          className="rounded-full bg-mist px-5 py-2 font-semibold transition hover:bg-line disabled:opacity-50"
        >
          {busy === "run" ? "Running…" : "Run"}
        </button>
        <button
          onClick={() => execute("check")}
          disabled={!!busy || disabled}
          className="rounded-full bg-hero px-5 py-2 font-semibold text-paper transition hover:bg-hero-deep disabled:opacity-50"
        >
          {busy === "check" ? "Checking…" : "Check my solution"}
        </button>
        {exercise.kind === "python" && !result && <span className="text-sm text-ink-soft">The first run loads Python in your browser, a few seconds.</span>}
      </div>
      {result && (
        <div className="border-t border-line bg-ink px-5 py-4 font-mono text-[13px] leading-relaxed text-[#e3e7ee]">
          {result.output && <pre className="whitespace-pre-wrap">{result.output}</pre>}
          {!result.ok && <pre className="whitespace-pre-wrap text-[#ff8a99]">{result.error}</pre>}
          {result.ok && !result.output && !testState && <span className="text-[#98a0b2]">No output. Add a print() / console.log() to see values.</span>}
          {testState && (
            <p className={`mt-1 font-sans text-sm font-semibold ${testState.passed ? "text-[#5ce0b0]" : "text-[#ff8a99]"}`}>
              {testState.passed ? "✓ All checks passed" : `✗ ${testState.error}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
