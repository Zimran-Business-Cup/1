"use client";

import { ArrowRight, AudioLines, Mic, MousePointer2, Send, Square, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { stripTags, type WalkthroughStep } from "@/contracts/flicky";
import type { WorkspaceKind } from "@/contracts/workspace";
import { postEvent } from "@/lib/api";
import { anchorRect, collectAnchors } from "@/lib/flicky/anchors";
import { ask, createSpeaker, FlickyError, transcribe, type Speaker } from "@/lib/flicky/client";
import { MicError, startRecording, type Recording } from "@/lib/flicky/recorder";

// Flicky: hold Ctrl+Alt+X (⌃⌥X on a Mac), ask out loud, let go. The answer is
// spoken, and a cursor walks through the steps on screen; each step waits for
// a click on its target. A typed question works the same way without a mic.

type Phase = "idle" | "listening" | "transcribing" | "thinking" | "answering";
type Point = { x: number; y: number };

const HINT_KEY = "1ry-space:flicky-used";
const BARS = 28;
const MIN_SECONDS = 0.4;
const MAX_SECONDS = 30;

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function readHintSeen(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
}

/** Streamed text without tags, cutting a tag that is still arriving. */
function visibleText(raw: string): string {
  const open = raw.lastIndexOf("[");
  const text = stripTags(open >= 0 && raw.indexOf("]", open) < 0 ? raw.slice(0, open) : raw);
  // Tags on their own lines leave gaps behind; keep at most one empty line.
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

function Keys({ mac, dark = false }: { mac: boolean; dark?: boolean }) {
  const keys = mac ? ["⌃", "⌥", "X"] : ["Ctrl", "Alt", "X"];
  return (
    <span className="inline-flex items-center gap-1" aria-label={mac ? "Control Option X" : "Ctrl Alt X"}>
      {keys.map((k) => (
        <kbd
          key={k}
          className={`grid h-6 min-w-6 place-items-center rounded-md px-1.5 font-sans text-[12px] font-bold leading-none shadow-[inset_0_-2px_0_rgba(20,26,39,0.18)] ${dark ? "bg-paper/20 text-paper" : "bg-mist text-ink"}`}
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

export function Flicky({ sessionId, taskId, workspace }: { sessionId: string; taskId: string | null; workspace: WorkspaceKind }) {
  const [mac] = useState(isMac);
  const [phase, setPhase] = useState<Phase>("idle");
  const [panelOpen, setPanelOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(() => !readHintSeen());
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0));
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<WalkthroughStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [target, setTarget] = useState<DOMRect | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [muted, setMuted] = useState(false);
  const [typed, setTyped] = useState("");
  const [viaKeys, setViaKeys] = useState(false);

  const pill = useRef<HTMLButtonElement>(null);
  const recording = useRef<Recording | null>(null);
  const stopWanted = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const abort = useRef<AbortController | null>(null);
  const speakerRef = useRef<Speaker | null>(null);
  const history = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const cursorRef = useRef<Point | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viaKeysRef = useRef(false);

  const speaker = () => (speakerRef.current ??= createSpeaker());
  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const moveCursor = (p: Point | null) => {
    cursorRef.current = p;
    setCursor(p);
  };

  // The hint shows on every visit until Flicky has been used once; "Got it" only hides it for now.
  const dismissHint = () => {
    setHintOpen(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {}
  };

  const clearWalkthrough = useCallback(() => {
    setSteps([]);
    setStepIndex(0);
    setTarget(null);
    cursorRef.current = null;
    setCursor(null);
  }, []);

  /** Stops whatever is running: the recording, the stream, the voice and the cursor. */
  const halt = useCallback(() => {
    recording.current?.cancel();
    recording.current = null;
    if (maxTimer.current) clearTimeout(maxTimer.current);
    abort.current?.abort();
    abort.current = null;
    speakerRef.current?.stop();
    go("idle");
  }, []);

  const pointFor = (rect: DOMRect, step: WalkthroughStep): Point =>
    step.target.kind === "anchor" && step.target.anchorId.startsWith("code.lines.")
      ? { x: rect.left + Math.min(26, rect.width / 2), y: rect.top + rect.height / 2 }
      : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

  /** Moves to the first step from `from` whose target is on screen; past the end, the cursor leaves. */
  const showStep = useCallback((list: WalkthroughStep[], from: number) => {
    for (let i = from; i < list.length; i++) {
      const t = list[i].target;
      const rect = t.kind === "anchor" ? anchorRect(t.anchorId) : null;
      if (!rect) continue;
      setStepIndex(i);
      setTarget(rect);
      const point = pointFor(rect, list[i]);
      if (!cursorRef.current) {
        // Fly in from the Flicky button.
        const start = pill.current?.getBoundingClientRect();
        moveCursor(start ? { x: start.left + start.width / 2, y: start.bottom } : point);
        requestAnimationFrame(() => requestAnimationFrame(() => moveCursor(point)));
      } else {
        moveCursor(point);
      }
      return;
    }
    setStepIndex(list.length);
    setTarget(null);
    setTimeout(() => moveCursor(null), 700);
  }, []);

  const askFlicky = useCallback(
    async (q: string) => {
      const text = q.trim();
      if (!text) return;
      halt();
      clearWalkthrough();
      setPanelOpen(true);
      setError(null);
      setQuestion(text);
      setAnswer("");
      go("thinking");
      const controller = new AbortController();
      abort.current = controller;
      let raw = "";
      try {
        await ask(
          { sessionId, taskId, workspace, question: text, anchors: collectAnchors(), snapshot: null, history: history.current.slice(-6) },
          (event) => {
            if (controller.signal.aborted) return;
            if (event.type === "chunk") {
              raw += event.text;
              setAnswer(visibleText(raw));
              if (phaseRef.current === "thinking") go("answering");
            } else if (event.type === "done") {
              go("answering");
              setAnswer(event.text);
              history.current.push({ role: "user", content: text }, { role: "assistant", content: event.text });
              const list = event.walkthrough?.steps ?? [];
              setSteps(list);
              if (list.length) showStep(list, 0);
              if (!muted && event.text) void speaker().speak(event.text);
              postEvent({ type: "hint", sessionId, taskId, source: "flicky", steps: list.length });
            } else if (event.type === "error") {
              setError(event.message);
            }
          },
          controller.signal,
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof FlickyError ? err.message : "Flicky couldn't answer right now. Try again.");
        go("idle");
      }
    },
    [clearWalkthrough, halt, muted, sessionId, showStep, taskId, workspace],
  );

  const stopListening = useCallback(async () => {
    const rec = recording.current;
    if (!rec) {
      // Keys released while the mic permission prompt was still open.
      stopWanted.current = true;
      return;
    }
    recording.current = null;
    if (maxTimer.current) clearTimeout(maxTimer.current);
    const { wav, seconds } = await rec.stop();
    if (seconds < MIN_SECONDS) {
      setError(viaKeysRef.current ? "Hold the keys while you talk, then let go." : "That was too short. Try again and say your question.");
      go("idle");
      return;
    }
    go("transcribing");
    const controller = new AbortController();
    abort.current = controller;
    try {
      const text = await transcribe(wav, controller.signal);
      if (controller.signal.aborted) return;
      if (!text) {
        setError("I didn't catch that. Try again a little closer to the mic.");
        go("idle");
        return;
      }
      void askFlicky(text);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof FlickyError ? err.message : "I couldn't hear that. Try again.");
      go("idle");
    }
  }, [askFlicky]);

  const startListening = useCallback(
    async (keys: boolean) => {
      if (phaseRef.current === "listening") return;
      halt();
      clearWalkthrough();
      dismissHint();
      setPanelOpen(true);
      setError(null);
      setQuestion("");
      setAnswer("");
      setLevels(Array(BARS).fill(0));
      viaKeysRef.current = keys;
      setViaKeys(keys);
      stopWanted.current = false;
      go("listening");
      try {
        recording.current = await startRecording((level) => setLevels((prev) => [...prev.slice(1), level]));
      } catch (err) {
        setError(err instanceof MicError ? err.message : "The microphone didn't start. Type your question instead.");
        go("idle");
        return;
      }
      // Closed or restarted while the mic was starting.
      if ((phaseRef.current as Phase) !== "listening") {
        recording.current?.cancel();
        recording.current = null;
        return;
      }
      maxTimer.current = setTimeout(() => void stopListening(), MAX_SECONDS * 1000);
      if (stopWanted.current) void stopListening();
    },
    [clearWalkthrough, halt, stopListening],
  );

  const close = useCallback(() => {
    halt();
    clearWalkthrough();
    setPanelOpen(false);
    setError(null);
  }, [clearWalkthrough, halt]);

  // Hold Ctrl+Alt+X (⌃⌥X) to talk, let go to ask. Esc closes Flicky first.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.code === "KeyX") {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) void startListening(true);
      } else if (e.key === "Escape" && document.querySelector("[data-flicky-open]")) {
        // Keep the workspace open: this Esc only closes Flicky.
        e.stopPropagation();
        close();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (phaseRef.current === "listening" && viaKeysRef.current && (e.code === "KeyX" || e.key === "Control" || e.key === "Alt")) {
        void stopListening();
      }
    };
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
    };
  }, [close, startListening, stopListening]);

  // A step moves on when the learner clicks its target; the cursor follows layout changes.
  useEffect(() => {
    if (!target) return;
    const current = steps[stepIndex];
    const onPointer = (e: PointerEvent) => {
      const r = target;
      if (e.clientX >= r.left - 6 && e.clientX <= r.right + 6 && e.clientY >= r.top - 6 && e.clientY <= r.bottom + 6) {
        setTimeout(() => showStep(steps, stepIndex + 1), 250);
      }
    };
    const relayout = () => {
      if (!current || current.target.kind !== "anchor") return;
      const rect = anchorRect(current.target.anchorId);
      if (!rect) return;
      setTarget(rect);
      moveCursor(pointFor(rect, current));
    };
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("resize", relayout);
    return () => {
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("resize", relayout);
    };
  }, [showStep, stepIndex, steps, target]);

  // Leaving the workspace stops the mic, the stream and the voice.
  useEffect(() => () => halt(), [halt]);

  const onPill = () => {
    if (phase === "listening") void stopListening();
    else void startListening(false);
  };

  const submitTyped = (e: FormEvent) => {
    e.preventDefault();
    const q = typed;
    setTyped("");
    dismissHint();
    void askFlicky(q);
  };

  const toggleMute = () => {
    setMuted((m) => {
      if (!m) speakerRef.current?.stop();
      return !m;
    });
  };

  const step = steps[stepIndex];
  // The panel sits bottom-right. A target in the right-hand column (the design properties) sends it to the
  // bottom-left; a wide target under it sends it up. The caption flips near the right edge.
  const panelLeft = !!target && target.right > window.innerWidth - 430 && target.left > 430;
  const panelUp = !panelLeft && !!target && target.bottom > window.innerHeight - 340 && target.right > window.innerWidth - 430;
  const captionLeft = !!cursor && cursor.x > window.innerWidth - 260;
  const status =
    phase === "listening"
      ? viaKeys
        ? "Listening… let go of the keys when you're done"
        : "Listening… press stop when you're done"
      : phase === "transcribing"
        ? "Got it, writing that down…"
        : phase === "thinking"
          ? "Thinking…"
          : "Ask about your task";

  return (
    <div className="relative">
      <button
        ref={pill}
        onClick={onPill}
        aria-pressed={phase === "listening"}
        title={`Hold ${mac ? "⌃ ⌥ X" : "Ctrl + Alt + X"} and ask out loud`}
        className={`flex items-center gap-2 rounded-full p-1.5 text-sm font-semibold transition sm:pr-3 ${phase === "listening" ? "bg-paper text-ink" : "bg-paper/15 text-paper hover:bg-paper/25"}`}
      >
        <span className={`grid size-7 place-items-center rounded-full ${phase === "listening" ? "flicky-live bg-rose text-paper" : "bg-paper text-hero"}`}>
          {phase === "listening" ? <Square size={12} fill="currentColor" aria-hidden /> : <Mic size={15} aria-hidden />}
        </span>
        <span className="sr-only sm:not-sr-only">{phase === "listening" ? "Stop" : "Ask Space"}</span>
        <span className="hidden xl:inline-flex">
          <Keys mac={mac} dark={phase !== "listening"} />
        </span>
      </button>

      {hintOpen && !panelOpen && (
        <div role="dialog" aria-label="Space voice help" className="flicky-pop absolute right-0 top-full z-50 mt-3 w-[min(340px,calc(100vw-1.5rem))] rounded-[1.5rem] bg-paper p-5 text-ink shadow-[0_24px_60px_-20px_rgba(20,26,39,0.55)]">
          <span aria-hidden className="absolute -top-1.5 right-10 size-3 rotate-45 bg-paper" />
          <p className="flex items-center gap-2 font-bold">
            <span className="grid size-8 place-items-center rounded-full bg-hero text-paper">
              <AudioLines size={16} aria-hidden />
            </span>
            Stuck? Just ask out loud
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            Hold <Keys mac={mac} />, say your question, then let go. Space answers out loud and points at the right spot on your screen.
          </p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => void startListening(false)} className="flex items-center gap-1.5 rounded-full bg-hero px-4 py-2 text-sm font-semibold text-paper transition hover:bg-hero-deep">
              <Mic size={15} aria-hidden /> Try it now
            </button>
            <button onClick={() => setHintOpen(false)} className="rounded-full bg-mist px-4 py-2 text-sm font-semibold transition hover:bg-line">
              Got it
            </button>
          </div>
        </div>
      )}

      {typeof document !== "undefined" &&
        createPortal(
          <>
            {panelOpen && (
              <section
                data-flicky-open
                aria-label="Space"
                className={`flicky-pop fixed z-[60] ${panelLeft ? "left-3" : "right-3"} ${panelUp ? "top-[4.5rem]" : "bottom-3"} flex max-h-[calc(100dvh-6rem)] w-[min(400px,calc(100vw-1.5rem))] flex-col rounded-[1.5rem] bg-paper text-ink shadow-[0_28px_70px_-24px_rgba(20,26,39,0.6)]`}
              >
                <header className="flex items-center gap-3 px-5 pb-2 pt-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-hero text-paper">
                    <MousePointer2 size={17} aria-hidden fill="currentColor" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-tight">Space</p>
                    <p className="truncate text-sm text-ink-soft" aria-live="polite">
                      {status}
                    </p>
                  </div>
                  <button onClick={toggleMute} aria-label={muted ? "Turn the voice on" : "Mute the voice"} className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-mist hover:text-ink">
                    {muted ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
                  </button>
                  <button onClick={close} aria-label="Close Space" className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-mist hover:text-ink">
                    <X size={18} aria-hidden />
                  </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
                  {phase === "listening" && (
                    <div className="flex h-16 items-center justify-center gap-[3px] rounded-2xl bg-hero-wash" aria-hidden>
                      {levels.map((l, i) => (
                        <span key={i} className="w-[3px] rounded-full bg-hero transition-[height] duration-75" style={{ height: `${6 + l * 40}px` }} />
                      ))}
                    </div>
                  )}
                  {phase === "listening" && !viaKeys && (
                    <button onClick={() => void stopListening()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/85">
                      <Square size={12} fill="currentColor" aria-hidden /> Stop and ask
                    </button>
                  )}

                  {question && (
                    <p className="ml-auto mt-1 w-fit max-w-[90%] rounded-[1.1rem] bg-hero px-4 py-2.5 text-[15px] leading-snug text-paper">{question}</p>
                  )}
                  {(phase === "thinking" || phase === "transcribing") && (
                    <p className="mt-3 flex gap-1 px-1" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="flicky-dot size-2 rounded-full bg-hero" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </p>
                  )}
                  {answer && <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{answer}</p>}

                  {step && steps.length > 0 && stepIndex < steps.length && (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-mist px-3 py-2.5 text-sm">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-hero text-xs font-bold text-paper">
                        {stepIndex + 1}/{steps.length}
                      </span>
                      <span className="min-w-0 flex-1 font-semibold">{step.label}</span>
                      <button onClick={() => showStep(steps, stepIndex + 1)} className="flex items-center gap-1 rounded-full bg-paper px-3 py-1 font-semibold transition hover:bg-line">
                        {stepIndex + 1 < steps.length ? "Next" : "Done"} <ArrowRight size={14} aria-hidden />
                      </button>
                    </div>
                  )}

                  {error && <p role="alert" className="mt-3 rounded-2xl bg-rose-wash px-4 py-3 text-[15px] leading-snug text-rose">{error}</p>}
                </div>

                <form onSubmit={submitTyped} className="flex items-center gap-2 border-t border-line px-3 py-3">
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder="Or type your question"
                    aria-label="Type a question for Space"
                    className="min-w-0 flex-1 rounded-full bg-mist px-4 py-2.5 text-[15px] outline-none placeholder:text-ink-soft focus:bg-hero-wash"
                  />
                  <button type="submit" disabled={!typed.trim()} aria-label="Ask Space" className="grid size-10 shrink-0 place-items-center rounded-full bg-hero text-paper transition hover:bg-hero-deep disabled:opacity-40">
                    <Send size={16} aria-hidden />
                  </button>
                </form>
              </section>
            )}

            {target && (
              <div
                aria-hidden
                className="flicky-ring pointer-events-none fixed z-[58] rounded-xl"
                style={{ left: target.left - 5, top: target.top - 5, width: target.width + 10, height: target.height + 10 }}
              />
            )}
            {cursor && (
              <div aria-hidden className="flicky-cursor pointer-events-none fixed left-0 top-0 z-[61]" style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}>
                <svg width="30" height="30" viewBox="0 0 24 24" className="drop-shadow-[0_6px_10px_rgba(20,26,39,0.35)]">
                  <path d="M3 2.5 20.5 10l-7.4 2.6L10.5 20z" fill="var(--color-hero)" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
                {step && stepIndex < steps.length && (
                  <span className={`absolute top-6 flex items-center ${captionLeft ? "right-2 flex-row-reverse pl-3.5 pr-1.5" : "left-6 pl-1.5 pr-3.5"} gap-2 whitespace-nowrap rounded-full bg-ink py-1.5 text-sm font-semibold text-paper shadow-lg`}>
                    <span className="grid size-6 place-items-center rounded-full bg-hero text-[11px] font-bold">
                      {stepIndex + 1}/{steps.length}
                    </span>
                    {step.label}
                  </span>
                )}
              </div>
            )}
          </>,
          document.body,
        )}
    </div>
  );
}
