"use client";

import { toCanvas } from "html-to-image";
import type { Focus, Snapshot } from "@/contracts/flicky";
import { anchorsIn } from "./anchors";

// When the learner circles part of the screen while asking, Space gets a picture of
// the workspace with that circle drawn on it, plus the anchors inside it.

export type Point = { x: number; y: number };

const MAX_SIDE = 1600;
const MIN_SIZE = 24;
const MIN_LENGTH = 80;

/** The circled area, or null when the pointer only twitched. */
export function focusFromPath(path: Point[]): Focus | null {
  if (path.length < 4) return null;
  let length = 0;
  for (let i = 1; i < path.length; i++) length += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  const xs = path.map((p) => p.x);
  const ys = path.map((p) => p.y);
  const x = Math.max(0, Math.min(...xs));
  const y = Math.max(0, Math.min(...ys));
  const width = Math.min(innerWidth, Math.max(...xs)) - x;
  const height = Math.min(innerHeight, Math.max(...ys)) - y;
  if (length < MIN_LENGTH || width < MIN_SIZE || height < MIN_SIZE) return null;
  const area = { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
  return { ...area, anchorIds: anchorsIn(area) };
}

/** JPEG of the workspace with the circle drawn in red; null if the page can't be captured. */
export async function snapshotWithCircle(path: Point[]): Promise<Snapshot | null> {
  const root = document.querySelector<HTMLElement>("[data-snapshot-root]");
  if (!root) return null;
  const rect = root.getBoundingClientRect();
  try {
    const canvas = await toCanvas(root, { pixelRatio: Math.min(1, MAX_SIDE / Math.max(rect.width, rect.height)), skipFonts: true });
    const ctx = canvas.getContext("2d");
    if (ctx && path.length > 1) {
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      ctx.strokeStyle = "#e8384f";
      ctx.lineWidth = Math.max(3, 5 * sx);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      path.forEach((p, i) => (i ? ctx.lineTo((p.x - rect.left) * sx, (p.y - rect.top) * sy) : ctx.moveTo((p.x - rect.left) * sx, (p.y - rect.top) * sy)));
      ctx.stroke();
    }
    const data = canvas.toDataURL("image/jpeg", 0.75).split(",")[1] ?? "";
    if (!data || data.length > 2_900_000) return null;
    return { mediaType: "image/jpeg", data, width: canvas.width, height: canvas.height, viewportWidth: rect.width, viewportHeight: rect.height };
  } catch {
    return null;
  }
}
