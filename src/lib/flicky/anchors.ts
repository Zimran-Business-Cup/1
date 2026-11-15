"use client";

import { ANCHOR_ID, type Anchor } from "@/contracts/flicky";

// Anchors are the elements Flicky can point at. Elements opt in with
// data-anchor="code.run" (plus data-anchor-label / data-anchor-role); every
// line of the open file is an anchor too ("code.lines.7"), labelled with its
// text, which is also how the model reads the learner's code.

const MAX_ANCHORS = 300;
const MAX_LINES = 200;
const ROLES = new Set<Anchor["role"]>(["button", "field", "lines", "layer", "card", "tab", "region"]);

const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && !el.closest("[inert]");
};

const clip = (s: string, n = 80) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function editorLines(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-anchor="code.editor"] .cm-content > .cm-line')];
}

/** Every anchor currently on screen, at most 300. */
export function collectAnchors(): Anchor[] {
  const anchors: Anchor[] = [];
  const seen = new Set<string>();
  for (const el of document.querySelectorAll<HTMLElement>("[data-anchor]")) {
    const id = el.dataset.anchor ?? "";
    if (seen.has(id) || !ANCHOR_ID.test(id) || !visible(el)) continue;
    seen.add(id);
    const role = (el.dataset.anchorRole ?? "button") as Anchor["role"];
    const label = el.dataset.anchorLabel ?? el.getAttribute("aria-label") ?? el.textContent?.trim() ?? id;
    anchors.push({ id, label: clip(label || id), role: ROLES.has(role) ? role : "region" });
  }
  const lines = editorLines().slice(0, MAX_LINES);
  // Trailing empty lines all look alike: keep the first one, where new code would go.
  let end = lines.length;
  while (end > 1 && !lines[end - 1].textContent?.trim() && !lines[end - 2].textContent?.trim()) end--;
  lines
    .slice(0, end)
    .forEach((line, i) => {
      const text = line.textContent ?? "";
      anchors.push({ id: `code.lines.${i + 1}`, label: clip(text.trim() ? `line ${i + 1}: ${text.replace(/\s+$/, "")}` : `line ${i + 1} (empty)`), role: "lines" });
    });
  return anchors.slice(0, MAX_ANCHORS);
}

/** Screen rectangle of an anchor; "code.lines.4-6" covers lines 4 to 6. */
export function anchorRect(id: string): DOMRect | null {
  const lines = /^code\.lines\.(\d+)(?:-(\d+))?$/.exec(id);
  if (lines) {
    const all = editorLines();
    const from = Number(lines[1]);
    const to = Math.max(from, Number(lines[2] ?? from));
    const picked = all.slice(from - 1, to);
    if (!picked.length) return null;
    picked[0].scrollIntoView({ block: "nearest" });
    const rects = picked.map((l) => l.getBoundingClientRect());
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    // A line spans the whole editor width; point at the code, not the empty right side.
    const textWidth = Math.max(...picked.map((l) => textRight(l))) - left;
    const width = Math.max(48, Math.min(Math.max(...rects.map((r) => r.right)) - left, textWidth + 16));
    return new DOMRect(left, top, width, Math.max(...rects.map((r) => r.bottom)) - top);
  }
  const el = [...document.querySelectorAll<HTMLElement>(`[data-anchor="${CSS.escape(id)}"]`)].find(visible);
  if (!el) return null;
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
  return el.getBoundingClientRect();
}

type Area = { x: number; y: number; width: number; height: number };

const overlaps = (r: DOMRect, a: Area) => r.width > 0 && r.right > a.x && r.left < a.x + a.width && r.bottom > a.y && r.top < a.y + a.height;

/** Ids of the anchors on screen that overlap `area`, without scrolling anything into view. */
export function anchorsIn(area: Area): string[] {
  const ids = new Set<string>();
  for (const el of document.querySelectorAll<HTMLElement>("[data-anchor]")) {
    const id = el.dataset.anchor ?? "";
    if (ANCHOR_ID.test(id) && visible(el) && overlaps(el.getBoundingClientRect(), area)) ids.add(id);
  }
  editorLines().forEach((line, i) => {
    if (overlaps(line.getBoundingClientRect(), area)) ids.add(`code.lines.${i + 1}`);
  });
  return [...ids].slice(0, 100);
}

/** Right edge of a line's text, so the highlight hugs the code. */
function textRight(line: HTMLElement): number {
  const range = document.createRange();
  range.selectNodeContents(line);
  const r = range.getBoundingClientRect();
  return r.width > 0 ? r.right : line.getBoundingClientRect().left + 48;
}
