import type { Fill } from "@/contracts/workspace";

// Colour helpers for the design canvas: hex input, CSS for a fill, and the
// WCAG contrast readout. The server grades contrast with the same formula.

/** "#2547d0", "2547D0" or "#25d" → "#2547D0"; anything else → null. */
export function normalizeHex(input: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (x) => x + x) : m[1];
  return `#${h.toUpperCase()}`;
}

/** CSS background for a fill. Scene angles: 0° runs left to right, CSS 90deg does. */
export function fillCss(fill: Fill | null): string {
  if (!fill) return "transparent";
  if (fill.type === "solid") return fill.color;
  const stops = [...fill.stops]
    .sort((a, b) => a.offset - b.offset)
    .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
    .join(", ");
  return `linear-gradient(${fill.angle + 90}deg, ${stops})`;
}

export const fillColors = (fill: Fill | null): string[] => (!fill ? [] : fill.type === "solid" ? [fill.color] : fill.stops.map((s) => s.color));

/** Mixes a colour with black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number): string {
  const h = normalizeHex(hex);
  if (!h) return hex;
  const target = amount < 0 ? 0 : 255;
  const k = Math.abs(amount);
  const parts = [1, 3, 5].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - k) + target * k));
  return `#${parts.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number | null {
  const h = normalizeHex(hex);
  if (!h) return null;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** The weakest contrast between the text and any colour of the fill behind it. */
export function worstContrast(text: string | null, fill: Fill | null): number | null {
  const colors = fillColors(fill);
  if (!text || !colors.length) return null;
  const ratios = colors.map((c) => contrastRatio(text, c));
  return ratios.every((r) => r !== null) ? Math.min(...(ratios as number[])) : null;
}
