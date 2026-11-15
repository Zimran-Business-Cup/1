"use client";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { Eraser, FileCode, FlaskConical, Folder, Lock, Play, Send, SquareTerminal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GradeResult, PublicTask } from "@/contracts/task";
import { postEvent } from "@/lib/api";
import { runCode, warmUp } from "@/lib/runner";

type Line = { kind: "cmd" | "out" | "ok" | "err" | "info"; text: string };

interface FileEntry {
  path: string;
  readonly: boolean;
  /** Visible tests shown as a read-only file; never submitted. */
  tests?: boolean;
}

const LANGUAGE_NAME = { python: "Python", javascript: "JavaScript" } as const;

// A light editor in the brand palette: white page, gray gutter, blue cursor and selection.
const brandTheme = EditorView.theme({
  "&": { backgroundColor: "#ffffff", color: "#141a27", height: "100%" },
  ".cm-gutters": { backgroundColor: "#ffffff", borderRight: "1px solid #eef0f4", color: "#a7afbe" },
  ".cm-activeLineGutter": { backgroundColor: "#f4f6fa", color: "#3d5afe" },
  ".cm-activeLine": { backgroundColor: "#f4f6fa" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "#3d5afe26 !important" },
  ".cm-cursor": { borderLeftColor: "#3d5afe", borderLeftWidth: "2px" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65" },
});

// Calm syntax colors that stay readable on white.
const brandHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword], color: "#3d5afe" },
    { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))], color: "#0e6f8a" },
    { tag: [t.string, t.special(t.string)], color: "#0b7a55" },
    { tag: [t.number, t.bool, t.null, t.atom], color: "#b4540a" },
    { tag: [t.className, t.typeName], color: "#7a4fd6" },
    { tag: [t.comment, t.lineComment, t.blockComment], color: "#8c95aa", fontStyle: "italic" },
    { tag: [t.operator, t.punctuation, t.bracket], color: "#586176" },
    { tag: [t.variableName, t.propertyName], color: "#141a27" },
  ]),
);

function testsPath(entry: string, language: "python" | "javascript") {
  const base = entry.split("/").pop() ?? entry;
  return language === "python" ? `test_${base}` : base.replace(/\.js$/, ".test.js");
}

const anchorFor = (path: string) => `code.file.${path.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export interface CodeWorkspaceProps {
  task: PublicTask & { code: NonNullable<PublicTask["code"]> };
  sessionId: string;
  initialFiles: Record<string, string>;
  /** Called (debounced) with the learner's files so a draft survives a reload. */
  onDraft: (files: Record<string, string>) => void;
  /** Sends the files for grading. Throws with a readable message on failure. */
  onSubmit: (files: { path: string; content: string }[]) => Promise<GradeResult>;
}

/** A VS Code–style editor: file tree, tabs, CodeMirror, and a terminal for Run and Submit. */
export function CodeWorkspace({ task, sessionId, initialFiles, onDraft, onSubmit }: CodeWorkspaceProps) {
  const language = task.card.language ?? "python";
  const code = task.code;
  const testFile = testsPath(code.entry, language);

  const entries: FileEntry[] = useMemo(
    () => [...code.files.map((f) => ({ path: f.path, readonly: f.readonly })), { path: testFile, readonly: true, tests: true }],
    [code.files, testFile],
  );
  const [files, setFiles] = useState<Record<string, string>>(() => ({ ...initialFiles, [testFile]: code.visibleTests }));
  const [active, setActive] = useState(code.entry);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [lines, setLines] = useState<Line[]>([{ kind: "info", text: "Run checks your code against the visible tests in your browser. Submit sends it for hidden tests." }]);
  const termEnd = useRef<HTMLDivElement>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    warmUp(language);
  }, [language]);
  // Block body on purpose: newer browsers return a Promise from scrollIntoView.
  useEffect(() => {
    termEnd.current?.scrollIntoView({ block: "end" });
  }, [lines]);
  useEffect(() => () => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
  }, []);

  const activeEntry = entries.find((e) => e.path === active) ?? entries[0];
  const learnerFiles = useCallback(
    (all: Record<string, string>) => code.files.map((f) => ({ path: f.path, content: all[f.path] ?? f.content })),
    [code.files],
  );

  function edit(value: string) {
    setFiles((prev) => {
      const next = { ...prev, [active]: value };
      if (draftTimer.current) clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => {
        const draft: Record<string, string> = {};
        for (const f of code.files) draft[f.path] = next[f.path] ?? f.content;
        onDraft(draft);
      }, 400);
      return next;
    });
  }

  const print = (...add: Line[]) => setLines((prev) => [...prev, ...add]);

  const run = useCallback(async () => {
    if (busy) return;
    setBusy("run");
    // The entry file runs last so helpers in other files are defined first.
    const ordered = [...code.files].sort((a, b) => Number(a.path === code.entry) - Number(b.path === code.entry));
    const source = ordered.map((f) => files[f.path] ?? f.content).join("\n\n");
    print({ kind: "cmd", text: `$ run ${testFile}` });
    const result = await runCode(language, source, code.visibleTests);
    const out: Line[] = result.output ? result.output.trimEnd().split("\n").map((text) => ({ kind: "out", text })) : [];
    const passed = !!(result.ok && result.tests?.passed);
    if (!result.ok) out.push({ kind: "err", text: result.error ?? "The code stopped with an error." });
    else if (result.tests) out.push(passed ? { kind: "ok", text: "✓ Visible tests passed" } : { kind: "err", text: `✗ ${result.tests.error ?? "A visible test failed"}` });
    print(...out);
    postEvent({ type: "run", sessionId, taskId: task.card.id, passed });
    setBusy(null);
  }, [busy, code, files, language, sessionId, task.card.id, testFile]);

  async function submit() {
    if (busy) return;
    setBusy("submit");
    print({ kind: "cmd", text: "$ submit (hidden tests on the server)" });
    try {
      const grade = await onSubmit(learnerFiles(files));
      const codeChecks = grade.checks.filter((c) => c.by === "code");
      print(
        ...grade.checks.map<Line>((c) => ({ kind: c.passed ? "ok" : "err", text: `${c.passed ? "✓" : "✗"} ${c.label}${!c.passed && c.message ? `: ${c.message}` : ""}` })),
        {
          kind: grade.passed ? "ok" : "err",
          text: `${grade.passed ? "Passed" : "Not yet"} · hidden checks ${codeChecks.filter((c) => c.passed).length}/${codeChecks.length}`,
        },
      );
    } catch (error) {
      print({ kind: "err", text: error instanceof Error ? error.message : "Submit failed. Try again." });
    } finally {
      setBusy(null);
    }
  }

  // Ctrl/Cmd + Enter runs the visible tests.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  return (
    <div className="flex h-full min-h-0 flex-col text-ink">
      {/* Tabs and actions */}
      <div className="flex items-center gap-2 border-b border-line px-2 py-2">
        <div role="tablist" aria-label="Open files" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {entries.map((e) => (
            <button
              key={e.path}
              data-anchor={anchorFor(e.path)}
              data-anchor-label={`${e.path} tab${e.tests ? " (visible tests, read only)" : ""}`}
              data-anchor-role="tab"
              role="tab"
              aria-selected={e.path === active}
              onClick={() => setActive(e.path)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-[13px] transition ${e.path === active ? "bg-mist text-ink" : "text-ink-soft hover:bg-mist hover:text-ink"}`}
            >
              {e.tests ? <FlaskConical size={14} aria-hidden /> : <FileCode size={14} aria-hidden />}
              {e.path}
              {e.readonly && <Lock size={12} aria-label="read only" className="text-steel" />}
            </button>
          ))}
        </div>
        <button
          data-anchor="code.run"
          data-anchor-label="Run button, top right of the editor: runs the visible tests"
          onClick={() => void run()}
          disabled={!!busy}
          title="Run visible tests (Ctrl+Enter)"
          className="flex shrink-0 items-center gap-2 rounded-full bg-mist px-4 py-2 text-sm font-semibold text-ink transition hover:bg-line disabled:opacity-50"
        >
          <Play size={15} aria-hidden fill="currentColor" /> {busy === "run" ? "Running…" : "Run"}
        </button>
        <button
          data-anchor="code.submit"
          data-anchor-label="Submit button, top right, just right of Run: sends code for hidden tests"
          onClick={() => void submit()}
          disabled={!!busy}
          className="flex shrink-0 items-center gap-2 rounded-full bg-hero px-4 py-2 text-sm font-bold text-paper transition hover:bg-hero-deep disabled:opacity-50"
        >
          <Send size={15} aria-hidden /> {busy === "submit" ? "Checking…" : "Submit"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* File tree */}
        <nav aria-label="Files" className="hidden w-48 shrink-0 border-r border-line bg-[#fafbfc] p-3 2xl:block">
          <p className="flex items-center gap-2 px-2 pb-2 font-mono text-[13px] text-ink-soft">
            <Folder size={14} aria-hidden /> {task.card.id.split("-").slice(0, -1).join("-") || "project"}/
          </p>
          <ul className="space-y-0.5">
            {entries.map((e) => (
              <li key={e.path}>
                <button
                  data-anchor={anchorFor(e.path)}
                  data-anchor-label={`${e.path} in the file tree`}
                  data-anchor-role="tab"
                  onClick={() => setActive(e.path)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-[13px] transition ${e.path === active ? "bg-hero-wash text-hero-deep" : "text-ink-soft hover:bg-mist"}`}
                >
                  {e.tests ? <FlaskConical size={14} aria-hidden /> : <FileCode size={14} aria-hidden />}
                  <span className="truncate">{e.path}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Editor */}
        <div data-anchor="code.editor" data-anchor-label={`Code editor with ${activeEntry.path}`} data-anchor-role="region" className="min-w-0 flex-1 overflow-hidden">
          <CodeMirror
            key={activeEntry.path}
            value={files[activeEntry.path] ?? ""}
            onChange={edit}
            theme="light"
            height="100%"
            style={{ height: "100%", fontSize: 13 }}
            extensions={[language === "python" ? python() : javascript(), brandTheme, brandHighlight]}
            editable={!activeEntry.readonly}
            readOnly={activeEntry.readonly}
            basicSetup={{ foldGutter: false }}
            aria-label={`${activeEntry.path}, ${LANGUAGE_NAME[language]}${activeEntry.readonly ? ", read only" : ""}`}
          />
        </div>
      </div>

      {/* Terminal */}
      <section data-anchor="code.terminal" data-anchor-label="Terminal with the Run and Submit results" data-anchor-role="region" aria-label="Terminal" className="flex h-[30%] min-h-32 shrink-0 flex-col border-t border-line bg-[#f6f7fa]">
        <header className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-ink-soft">
          <SquareTerminal size={15} aria-hidden /> Terminal
          <button onClick={() => setLines([])} aria-label="Clear terminal" className="ml-auto rounded-lg p-1 hover:bg-line hover:text-ink">
            <Eraser size={15} aria-hidden />
          </button>
        </header>
        <div role="log" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 font-mono text-[13px] leading-relaxed">
          {lines.map((l, i) => (
            <p
              key={i}
              className={`whitespace-pre-wrap ${l.kind === "cmd" ? "mt-2 font-semibold text-hero-deep" : l.kind === "ok" ? "text-[#0b7a55]" : l.kind === "err" ? "text-[#c62840]" : l.kind === "info" ? "text-ink-soft" : "text-ink"}`}
            >
              {l.text}
            </p>
          ))}
          {busy && <p className="term-cursor mt-1 text-hero">▍</p>}
          <div ref={termEnd} />
        </div>
      </section>
    </div>
  );
}
