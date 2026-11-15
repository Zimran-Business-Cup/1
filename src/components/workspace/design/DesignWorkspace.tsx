"use client";

import { Blend, CircleCheck, CircleX, Frame, ListChecks, MousePointer2, RotateCcw, RotateCw, Send, Square, SquareRoundCorner, Type } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { GradeResult, PublicTask } from "@/contracts/task";
import type { DesignScene, Fill, SceneNode } from "@/contracts/workspace";
import { fillCss, normalizeHex, shade, worstContrast } from "./color";

// A small Figma-like editor for design tasks: layers on the left, the frame on
// a canvas in the middle, properties of the selected layer on the right. The
// scene is plain JSON (src/contracts/workspace.ts); Submit sends it to the
// server, where rule checks decide pass or fail.

/** WCAG AA for body text. The readout uses it; the server has its own rules per task. */
const AA = 4.5;

const ICONS = { frame: Frame, rect: Square, text: Type } as const;
const TYPE_LABEL = { frame: "Frame", rect: "Rectangle", text: "Text" } as const;

const anchorPart = (id: string) => id.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
const round = (v: number) => Math.round(v * 100) / 100;

/** What Flicky reads about a layer: its name and the values that matter for the task. */
function describe(n: SceneNode): string {
  if (n.type === "text") return `${n.name} text "${n.text ?? ""}" on the canvas`;
  const fill = !n.fill ? "no fill" : n.fill.type === "solid" ? `solid ${n.fill.color}` : `linear ${n.fill.stops.map((s) => s.color).join("→")}`;
  return `${n.name} on the canvas: ${fill}, radius ${n.radius}${n.textColor ? `, text ${n.textColor}` : ""}`;
}

type Rect = Pick<SceneNode, "x" | "y" | "width" | "height">;
type Handle = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

// Resize handles around the selection: four corners and four invisible edges, as in Figma.
const HANDLES: { id: Handle; className: string }[] = [
  { id: "n", className: "-top-1 left-2 right-2 h-2 cursor-ns-resize" },
  { id: "s", className: "-bottom-1 left-2 right-2 h-2 cursor-ns-resize" },
  { id: "w", className: "-left-1 top-2 bottom-2 w-2 cursor-ew-resize" },
  { id: "e", className: "-right-1 top-2 bottom-2 w-2 cursor-ew-resize" },
  { id: "nw", className: "-left-2 -top-2 size-4 cursor-nwse-resize" },
  { id: "ne", className: "-right-2 -top-2 size-4 cursor-nesw-resize" },
  { id: "sw", className: "-bottom-2 -left-2 size-4 cursor-nesw-resize" },
  { id: "se", className: "-bottom-2 -right-2 size-4 cursor-nwse-resize" },
];

/** Bounds after dragging a handle by (dx, dy) scene px. The opposite side stays put; Shift on a corner keeps the proportions. */
function resizeRect(o: Rect, handle: Handle, dx: number, dy: number, keepRatio: boolean): Rect {
  const left = handle.includes("w");
  const right = handle.includes("e");
  const top = handle.includes("n");
  const bottom = handle.includes("s");
  let w = o.width + (right ? dx : left ? -dx : 0);
  let h = o.height + (bottom ? dy : top ? -dy : 0);
  if (keepRatio && (left || right) && (top || bottom) && o.width > 0 && o.height > 0) {
    if (Math.abs(w / o.width) > Math.abs(h / o.height)) h = (w * o.height) / o.width;
    else w = (h * o.width) / o.height;
  }
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  return { x: left ? o.x + o.width - w : o.x, y: top ? o.y + o.height - h : o.y, width: w, height: h };
}

// The screen starts selected: finding the right layer is part of the task.
const defaultSelection = (scene: DesignScene) => (scene.nodes.find((n) => n.type === "frame") ?? scene.nodes[0])?.id ?? null;

export interface DesignWorkspaceProps {
  task: PublicTask & { design: NonNullable<PublicTask["design"]> };
  initialScene: DesignScene;
  /** Called (debounced) with the scene so a draft survives a reload. */
  onDraft: (scene: DesignScene) => void;
  /** Sends the scene for the rule checks. Throws with a readable message on failure. */
  onSubmit: (scene: DesignScene) => Promise<GradeResult>;
}

export function DesignWorkspace({ task, initialScene, onDraft, onSubmit }: DesignWorkspaceProps) {
  const [scene, setScene] = useState<DesignScene>(initialScene);
  const [selectedId, setSelectedId] = useState<string | null>(() => defaultSelection(initialScene));
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState<{ result: GradeResult; scene: DesignScene } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; x: number; y: number; ox: number; oy: number } | null>(null);
  const sizing = useRef<{ id: string; handle: Handle; x: number; y: number; from: Rect } | null>(null);
  const saved = useRef(initialScene);
  const onDraftRef = useRef(onDraft);

  useEffect(() => {
    onDraftRef.current = onDraft;
  });

  // Save a draft shortly after the last change.
  useEffect(() => {
    if (scene === saved.current) return;
    const timer = setTimeout(() => {
      saved.current = scene;
      onDraftRef.current(scene);
    }, 400);
    return () => clearTimeout(timer);
  }, [scene]);

  // Zoom to fit: the frame always fills the canvas with some air around it.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const s = Math.min((width - 80) / scene.width, (height - 96) / scene.height, 1.5);
      setScale(Math.max(0.3, Math.floor(s * 100) / 100));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [scene.width, scene.height]);

  // Arrow keys nudge the selected layer by 1 (Shift: 10), like in Figma.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId || !e.key.startsWith("Arrow") || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable]")) return;
      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      e.preventDefault();
      setScene((prev) => ({ ...prev, nodes: prev.nodes.map((n) => (n.id === selectedId && n.type !== "frame" ? { ...n, x: n.x + dx, y: n.y + dy } : n)) }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const frame = scene.nodes.find((n) => n.type === "frame" && n.parentId === null) ?? null;
  const selected = scene.nodes.find((n) => n.id === selectedId) ?? null;
  const hovered = hoverId && hoverId !== selectedId ? (scene.nodes.find((n) => n.id === hoverId) ?? null) : null;
  const parentFill = (n: SceneNode) => scene.nodes.find((p) => p.id === n.parentId)?.fill ?? null;

  function update(id: string, patch: Partial<SceneNode>) {
    setScene((prev) => ({ ...prev, nodes: prev.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  }

  function grab(e: ReactPointerEvent<HTMLElement>, node: SceneNode) {
    e.stopPropagation();
    setSelectedId(node.id);
    if (node.type === "frame" || e.button !== 0) return;
    drag.current = { id: node.id, x: e.clientX, y: e.clientY, ox: node.x, oy: node.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: ReactPointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d) return;
    update(d.id, { x: Math.round(d.ox + (e.clientX - d.x) / scale), y: Math.round(d.oy + (e.clientY - d.y) / scale) });
  }

  const release = () => {
    drag.current = null;
  };

  function startResize(e: ReactPointerEvent<HTMLElement>, node: SceneNode, handle: Handle) {
    e.stopPropagation();
    if (e.button !== 0) return;
    sizing.current = { id: node.id, handle, x: e.clientX, y: e.clientY, from: { x: node.x, y: node.y, width: node.width, height: node.height } };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function resizeTo(e: ReactPointerEvent<HTMLElement>) {
    const r = sizing.current;
    if (!r) return;
    update(r.id, resizeRect(r.from, r.handle, (e.clientX - r.x) / scale, (e.clientY - r.y) / scale, e.shiftKey));
  }

  const endResize = () => {
    sizing.current = null;
  };

  function reset() {
    setScene(task.design.scene);
    setSelectedId(defaultSelection(task.design.scene));
    setGrade(null);
    setSubmitError(null);
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    setSubmitError(null);
    const sent = scene;
    try {
      setGrade({ result: await onSubmit(sent), scene: sent });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submit failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // Screen rectangle of a layer inside the scaled frame, for the selection overlay.
  const box = (n: SceneNode): CSSProperties => ({ left: n.x * scale, top: n.y * scale, width: n.width * scale, height: n.height * scale });

  // Layers panel: a tree with the top-most layer first at each level, as in Figma.
  const layerRows: { node: SceneNode; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const child of scene.nodes.filter((c) => c.parentId === parentId).reverse()) {
      layerRows.push({ node: child, depth });
      walk(child.id, depth + 1);
    }
  };
  walk(null, 0);
  const codeChecks = grade?.result.checks.filter((c) => c.by === "code") ?? [];

  return (
    <div className="@container flex h-full min-h-0 flex-col text-ink">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-line px-2 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span title="Move: drag a layer or nudge it with the arrow keys. Resize: drag a corner or an edge, hold Shift to keep the proportions" className="grid size-9 shrink-0 place-items-center rounded-xl bg-hero-wash text-hero-deep">
            <MousePointer2 size={16} aria-label="Move tool" />
          </span>
          <p className="min-w-0 truncate text-sm">
            <span className="text-ink-soft">{frame?.name ?? "Canvas"}</span>
            {selected && selected !== frame && (
              <>
                <span className="px-1.5 text-steel">/</span>
                <span className="font-semibold">{selected.name}</span>
              </>
            )}
          </p>
        </div>
        <span title="Zoom to fit" className="hidden font-mono text-[13px] text-ink-soft @lg:block">
          {Math.round(scale * 100)}%
        </span>
        <button
          data-anchor="design.reset"
          data-anchor-label="Reset button, top right: puts the screen back as it was"
          onClick={reset}
          disabled={busy}
          title="Put the screen back as it was"
          className="flex shrink-0 items-center gap-2 rounded-full bg-mist px-4 py-2 text-sm font-semibold text-ink transition hover:bg-line disabled:opacity-50"
        >
          <RotateCcw size={15} aria-hidden /> Reset
        </button>
        <button
          data-anchor="design.submit"
          data-anchor-label="Submit button, top right: sends the design for the design-system checks"
          onClick={() => void submit()}
          disabled={busy}
          className="flex shrink-0 items-center gap-2 rounded-full bg-hero px-4 py-2 text-sm font-bold text-paper transition hover:bg-hero-deep disabled:opacity-50"
        >
          <Send size={15} aria-hidden /> {busy ? "Checking…" : "Submit"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col @xl:flex-row">
        {/* Layers */}
        <nav aria-label="Layers" className="hidden w-52 shrink-0 overflow-y-auto border-r border-line bg-[#fafbfc] p-3 @4xl:block">
          <p className="px-2 pb-2 text-[13px] font-semibold text-ink-soft">Layers</p>
          <ul className="space-y-0.5">
            {layerRows.map(({ node: n, depth }) => {
              const Icon = ICONS[n.type];
              return (
                <li key={n.id}>
                  <button
                    data-anchor={`design.layers.${anchorPart(n.id)}`}
                    data-anchor-label={`${n.name} in the layers list`}
                    data-anchor-role="layer"
                    onClick={() => setSelectedId(n.id)}
                    onPointerEnter={() => setHoverId(n.id)}
                    onPointerLeave={() => setHoverId(null)}
                    aria-current={n.id === selectedId ? "true" : undefined}
                    style={{ paddingLeft: 8 + depth * 14 }}
                    className={`flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-[13px] transition ${n.id === selectedId ? "bg-hero-wash font-semibold text-hero-deep" : "text-ink hover:bg-mist"}`}
                  >
                    <Icon size={14} aria-hidden className={n.id === selectedId ? "" : "text-ink-soft"} />
                    <span className="truncate">{n.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Canvas */}
          <div
            ref={viewport}
            data-anchor="design.canvas"
            data-anchor-label={`Canvas with the ${frame?.name ?? "design"} screen`}
            data-anchor-role="region"
            onPointerDown={() => setSelectedId(null)}
            className="design-canvas relative min-h-56 flex-1 overflow-hidden bg-[#eef0f4]"
          >
            <div className="absolute left-1/2 top-1/2" style={{ width: scene.width * scale, height: scene.height * scale, transform: "translate(-50%, -50%)" }}>
              {frame && (
                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedId(frame.id);
                  }}
                  className={`absolute -top-6 left-0 text-xs font-medium ${selectedId === frame.id ? "text-hero-deep" : "text-ink-soft hover:text-ink"}`}
                >
                  {frame.name}
                </button>
              )}

              <div className="absolute left-0 top-0 origin-top-left" style={{ width: scene.width, height: scene.height, transform: `scale(${scale})` }}>
                {scene.nodes.map((n) => (
                  <div
                    key={n.id}
                    data-anchor={`design.layer.${anchorPart(n.id)}`}
                    data-anchor-label={describe(n)}
                    data-anchor-role="layer"
                    onPointerDown={(e) => grab(e, n)}
                    onPointerMove={move}
                    onPointerUp={release}
                    onPointerCancel={release}
                    onPointerEnter={() => setHoverId(n.id)}
                    onPointerLeave={() => setHoverId((h) => (h === n.id ? null : h))}
                    className={`absolute flex select-none items-center ${n.type === "text" ? "justify-start" : "justify-center"} ${n.type === "frame" ? "shadow-[0_18px_50px_-24px_rgba(20,26,39,0.45)]" : "cursor-move"}`}
                    style={{
                      left: n.x,
                      top: n.y,
                      width: n.width,
                      height: n.height,
                      borderRadius: n.radius,
                      background: fillCss(n.fill),
                      color: n.textColor ?? undefined,
                      fontSize: n.fontSize ?? undefined,
                    }}
                  >
                    {n.text && (
                      <span className={`truncate whitespace-pre tracking-[-0.01em] ${(n.fontSize ?? 16) >= 20 ? "font-bold" : "font-semibold"}`}>{n.text}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Hover and selection outlines stay 1.5px at any zoom */}
              {hovered && <div aria-hidden className="pointer-events-none absolute outline outline-[1.5px] outline-hero/60" style={box(hovered)} />}
              {selected && (
                <div aria-hidden className="pointer-events-none absolute outline outline-[1.5px] outline-hero" style={box(selected)}>
                  {/* The frame sets the screen size, so only the layers inside it resize */}
                  {selected.type !== "frame" &&
                    HANDLES.map((h) => (
                      <span
                        key={h.id}
                        onPointerDown={(e) => startResize(e, selected, h.id)}
                        onPointerMove={resizeTo}
                        onPointerUp={endResize}
                        onPointerCancel={endResize}
                        className={`pointer-events-auto absolute touch-none ${h.className}`}
                      >
                        {h.id.length === 2 && <span className="absolute inset-1 border-[1.5px] border-hero bg-paper" />}
                      </span>
                    ))}
                  <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-hero px-1.5 py-0.5 font-mono text-[11px] text-paper">
                    {round(selected.width)} × {round(selected.height)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Checks */}
          <section
            data-anchor="design.checks"
            data-anchor-label="Checks panel with the Submit results"
            data-anchor-role="region"
            aria-label="Checks"
            className="flex max-h-[34%] shrink-0 flex-col border-t border-line bg-[#f6f7fa]"
          >
            <header className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-ink-soft">
              <ListChecks size={15} aria-hidden /> Checks
              {grade && (
                <span className={`ml-auto ${grade.result.passed ? "text-[#0b7a55]" : "text-[#c62840]"}`}>
                  {grade.result.passed ? "Passed" : "Not yet"} · {codeChecks.filter((c) => c.passed).length}/{codeChecks.length}
                </span>
              )}
            </header>
            <div role="log" aria-live="polite" className="min-h-0 overflow-y-auto px-4 pb-3 text-[13px] leading-relaxed">
              {busy ? (
                <p className="text-hero">Checking your design against the design system…</p>
              ) : submitError ? (
                <p className="text-[#c62840]">{submitError}</p>
              ) : grade ? (
                <>
                  <ul>
                    {grade.result.checks.map((c) => (
                      <li key={c.id} className={c.passed ? "text-[#0b7a55]" : "text-[#c62840]"}>
                        {c.passed ? "✓" : "✗"} {c.label}
                        {!c.passed && c.message ? `: ${c.message}` : ""}
                      </li>
                    ))}
                  </ul>
                  {grade.scene !== scene && <p className="mt-1 text-ink-soft">You changed the design after this check. Submit again to recheck.</p>}
                </>
              ) : (
                <p className="text-ink-soft">Submit sends the whole screen to the design-system checks. The result shows up here and in the mentor chat.</p>
              )}
            </div>
          </section>
        </div>

        {/* Properties */}
        <aside aria-label="Layer properties" className="max-h-[45%] w-full shrink-0 overflow-y-auto border-t border-line @xl:max-h-none @xl:w-64 @xl:border-l @xl:border-t-0 @5xl:w-72">
          {selected ? (
            <Properties key={selected.id} node={selected} behind={selected.fill ?? parentFill(selected)} onChange={(patch) => update(selected.id, patch)} />
          ) : (
            <p className="p-5 text-sm leading-relaxed text-ink-soft">Select a layer on the canvas or in the layers list to change its fill, corners and text.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

// ---------- properties panel ----------

function Properties({ node, behind, onChange }: { node: SceneNode; behind: Fill | null; onChange: (patch: Partial<SceneNode>) => void }) {
  const Icon = ICONS[node.type];
  return (
    <div className="divide-y divide-line">
      <header className="flex items-center gap-2 px-4 py-3">
        <Icon size={15} aria-hidden className="shrink-0 text-ink-soft" />
        <p className="min-w-0 truncate font-semibold">{node.name}</p>
        <span className="ml-auto shrink-0 rounded-full bg-mist px-2 py-0.5 text-xs text-ink-soft">{TYPE_LABEL[node.type]}</span>
      </header>

      <Section title="Layout">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" ariaLabel="X position" value={node.x} onChange={(x) => onChange({ x })} />
          <NumberField label="Y" ariaLabel="Y position" value={node.y} onChange={(y) => onChange({ y })} />
          <NumberField label="W" ariaLabel="Width" value={node.width} min={1} onChange={(width) => onChange({ width })} />
          <NumberField label="H" ariaLabel="Height" value={node.height} min={1} onChange={(height) => onChange({ height })} />
        </div>
      </Section>

      {node.type !== "text" && (
        <Section title="Corner radius">
          <NumberField
            label={<SquareRoundCorner size={14} />}
            ariaLabel="Corner radius"
            value={node.radius}
            min={0}
            anchor="design.radius"
            anchorLabel={`Corner radius field, now ${node.radius}`}
            onChange={(radius) => onChange({ radius })}
          />
        </Section>
      )}

      {node.type !== "text" && <FillSection fill={node.fill} onChange={(fill) => onChange({ fill })} />}

      {node.text !== null && (
        <Section title="Text">
          <TextField value={node.text} onChange={(text) => onChange({ text })} />
          <div className="grid grid-cols-[1fr_5rem] gap-2">
            <ColorField
              label="Text colour"
              value={node.textColor ?? "#000000"}
              anchor="design.text.color"
              anchorLabel={`Text colour field, now ${node.textColor ?? "none"}`}
              onChange={(textColor) => onChange({ textColor })}
            />
            <NumberField label="Aa" ariaLabel="Font size" value={node.fontSize ?? 16} min={6} onChange={(fontSize) => onChange({ fontSize })} />
          </div>
          <ContrastReadout text={node.textColor} fill={behind} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5 px-4 py-4">
      <h3 className="text-[13px] font-semibold text-ink-soft">{title}</h3>
      {children}
    </section>
  );
}

function FillSection({ fill, onChange }: { fill: Fill | null; onChange: (fill: Fill) => void }) {
  function setType(type: Fill["type"]) {
    if (type === fill?.type) return;
    if (type === "solid") {
      onChange({ type: "solid", color: fill?.type === "linear" ? fill.stops[0].color : "#FFFFFF" });
    } else {
      const base = fill?.type === "solid" ? fill.color : "#3D5AFE";
      onChange({ type: "linear", angle: 0, stops: [{ offset: 0, color: base }, { offset: 1, color: shade(base, -0.35) }] });
    }
  }

  return (
    <Section title="Fill">
      <div
        role="radiogroup"
        aria-label="Fill type"
        data-anchor="design.fill.type"
        data-anchor-label={`Fill type switch, now ${fill?.type ?? "none"}`}
        data-anchor-role="field"
        className="grid grid-cols-2 gap-1 rounded-xl bg-mist p-1"
      >
        {(["solid", "linear"] as const).map((t) => (
          <button
            key={t}
            role="radio"
            aria-checked={fill?.type === t}
            data-anchor={`design.fill.${t}`}
            data-anchor-label={t === "solid" ? "Solid fill option" : "Linear gradient fill option"}
            onClick={() => setType(t)}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-semibold transition ${fill?.type === t ? "bg-paper text-ink shadow-[0_1px_3px_rgba(20,26,39,0.12)]" : "text-ink-soft hover:text-ink"}`}
          >
            {t === "solid" ? <Square size={14} aria-hidden /> : <Blend size={14} aria-hidden />}
            {t === "solid" ? "Solid" : "Linear"}
          </button>
        ))}
      </div>

      {fill?.type === "solid" && (
        <ColorField label="Fill colour" value={fill.color} anchor="design.fill.color" anchorLabel={`Fill colour field, now ${fill.color}`} onChange={(color) => onChange({ type: "solid", color })} />
      )}

      {fill?.type === "linear" && (
        <>
          <div aria-hidden className="h-6 rounded-lg ring-1 ring-ink/10" style={{ background: fillCss({ ...fill, angle: 0 }) }} />
          <div data-anchor="design.fill.stops" data-anchor-label="Gradient stops: the colour and position of each" data-anchor-role="field" className="space-y-2">
            {fill.stops.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_4.5rem] gap-2">
                <ColorField
                  label={`Stop ${i + 1} colour`}
                  value={s.color}
                  onChange={(color) => onChange({ ...fill, stops: fill.stops.map((x, j) => (j === i ? { ...x, color } : x)) })}
                />
                <NumberField
                  label=""
                  ariaLabel={`Stop ${i + 1} position`}
                  suffix="%"
                  value={Math.round(s.offset * 100)}
                  min={0}
                  max={100}
                  onChange={(v) => onChange({ ...fill, stops: fill.stops.map((x, j) => (j === i ? { ...x, offset: v / 100 } : x)) })}
                />
              </div>
            ))}
          </div>
          <NumberField label={<RotateCw size={14} />} ariaLabel="Gradient angle" suffix="°" value={fill.angle} anchor="design.fill.angle" anchorLabel={`Gradient angle, now ${fill.angle}°`} onChange={(angle) => onChange({ ...fill, angle })} />
        </>
      )}
    </Section>
  );
}

function ContrastReadout({ text, fill }: { text: string | null; fill: Fill | null }) {
  const ratio = worstContrast(text, fill);
  const ok = ratio !== null && ratio >= AA;
  return (
    <div
      data-anchor="design.contrast"
      data-anchor-label={`Contrast readout, now ${ratio === null ? "unknown" : `${ratio.toFixed(1)}:1`}`}
      data-anchor-role="field"
      className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${ok ? "bg-mint-wash" : "bg-rose-wash"}`}
    >
      {ok ? <CircleCheck size={18} aria-hidden className="mt-0.5 shrink-0 text-[#0b7a55]" /> : <CircleX size={18} aria-hidden className="mt-0.5 shrink-0 text-[#c62840]" />}
      <div className="min-w-0">
        <p className="text-sm font-semibold">Contrast {ratio === null ? "—" : `${ratio.toFixed(2)}:1`}</p>
        <p className="text-xs leading-snug text-ink-soft">
          {fill?.type === "linear" ? "Measured at the weakest colour of the gradient. " : ""}Body text needs {AA}:1 (WCAG AA).
        </p>
      </div>
    </div>
  );
}

// ---------- inputs ----------

const fieldBox = "field-box flex h-9 items-center gap-2 rounded-xl bg-mist px-3 focus-within:ring-2 focus-within:ring-hero";

/** A number input that lets you type freely and applies every valid value. ↑/↓ step by 1, Shift by 10. */
function NumberField({
  label,
  ariaLabel,
  value,
  onChange,
  min,
  max,
  suffix,
  anchor,
  anchorLabel,
}: {
  /** A short letter or an icon in front of the value. */
  label: ReactNode;
  ariaLabel: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  anchor?: string;
  anchorLabel?: string;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));

  return (
    <label data-anchor={anchor} data-anchor-label={anchorLabel} data-anchor-role={anchor ? "field" : undefined} className={fieldBox}>
      {label && (
        <span aria-hidden className="grid w-4 shrink-0 place-items-center text-xs font-semibold text-ink-soft">
          {label}
        </span>
      )}
      <input
        inputMode="decimal"
        aria-label={ariaLabel}
        value={focused ? text : String(round(value))}
        onFocus={(e) => {
          setText(String(round(value)));
          setFocused(true);
          e.currentTarget.select();
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          const v = Number.parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(clamp(v));
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          const v = clamp(round(value) + (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : 1));
          setText(String(v));
          onChange(v);
        }}
        className="w-full min-w-0 bg-transparent text-sm tabular-nums outline-none"
      />
      {suffix && <span className="shrink-0 text-xs text-ink-soft">{suffix}</span>}
    </label>
  );
}

/** A swatch that opens the system colour picker, plus a hex field applied once it has 6 digits. */
function ColorField({ label, value, onChange, anchor, anchorLabel }: { label: string; value: string; onChange: (hex: string) => void; anchor?: string; anchorLabel?: string }) {
  const hex = normalizeHex(value) ?? "#000000";
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div data-anchor={anchor} data-anchor-label={anchorLabel} data-anchor-role={anchor ? "field" : undefined} className={`${fieldBox} pl-1.5`}>
      <label className="relative size-6 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-ink/15" style={{ background: hex }}>
        <span className="sr-only">{label}: open the colour picker</span>
        <input type="color" value={hex.toLowerCase()} onChange={(e) => onChange(normalizeHex(e.target.value) ?? hex)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
      </label>
      <span aria-hidden className="text-xs text-ink-soft">
        #
      </span>
      <input
        aria-label={`${label}, hex`}
        value={focused ? text : hex.slice(1)}
        maxLength={7}
        spellCheck={false}
        autoComplete="off"
        onFocus={(e) => {
          setText(hex.slice(1));
          setFocused(true);
          e.currentTarget.select();
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          const digits = e.target.value.replace("#", "");
          const next = normalizeHex(digits);
          if (next && digits.length === 6) onChange(next);
        }}
        className="w-full min-w-0 bg-transparent font-mono text-sm uppercase outline-none"
      />
    </div>
  );
}

function TextField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className={fieldBox}>
      <Type size={14} aria-hidden className="shrink-0 text-ink-soft" />
      <input aria-label="Text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full min-w-0 bg-transparent text-sm outline-none" />
    </label>
  );
}
