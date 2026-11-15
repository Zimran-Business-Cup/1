import type { Check } from "@/contracts/task";
import type { DesignScene, Fill, SceneNode } from "@/contracts/workspace";
import { contrastRatio } from "./contrast";

// Rule checks for design tasks. Each task lists the rules its ticket asks for; a rule reads
// the submitted scene and becomes one check. Positions allow half a pixel of slack.

export type DesignRule =
  | { kind: "radius"; node: string; value: number }
  | { kind: "fill"; node: string; type: Fill["type"]; color?: string }
  | { kind: "contrast"; node: string; min: number }
  | { kind: "fontSize"; node: string; value: number }
  | { kind: "left"; nodes: string[]; x: number }
  | { kind: "size"; nodes: string[]; width?: number; height?: number }
  | { kind: "minSize"; node: string; width: number; height: number }
  | { kind: "rightEdge"; node: string; x: number }
  | { kind: "inside"; node: string }
  | { kind: "gaps"; nodes: string[]; gap: number }
  | { kind: "centerX"; node: string }
  | { kind: "dark"; node: string; min: number };

export const DESIGN_RULES: Record<string, DesignRule[]> = {
  "design-corners-1": [{ kind: "radius", node: "promo", value: 16 }],
  "design-brand-color-1": [
    { kind: "fill", node: "signup", type: "solid", color: "#3D5AFE" },
    { kind: "contrast", node: "signup", min: 4.5 },
  ],
  "design-contrast-1": [
    { kind: "contrast", node: "note", min: 4.5 },
    { kind: "fontSize", node: "note", value: 13 },
  ],
  "design-type-scale-1": [
    { kind: "fontSize", node: "title", value: 28 },
    { kind: "fontSize", node: "body", value: 16 },
  ],
  "design-align-1": [{ kind: "left", nodes: ["name", "email", "edit"], x: 24 }],
  "design-tap-target-1": [
    { kind: "minSize", node: "close", width: 44, height: 44 },
    { kind: "rightEdge", node: "close", x: 366 },
    { kind: "inside", node: "close" },
  ],
  "design-spacing-1": [
    { kind: "gaps", nodes: ["row-1", "row-2", "row-3", "row-4"], gap: 16 },
    { kind: "size", nodes: ["row-1", "row-2", "row-3", "row-4"], width: 342, height: 56 },
  ],
  "design-center-1": [
    { kind: "centerX", node: "shop" },
    { kind: "size", nodes: ["shop"], width: 220 },
  ],
  "design-pay-button-1": [
    { kind: "fill", node: "pay-button", type: "linear" },
    { kind: "radius", node: "pay-button", value: 12 },
    { kind: "contrast", node: "pay-button", min: 4.5 },
  ],
  "design-dark-card-1": [
    { kind: "fill", node: "card", type: "solid" },
    { kind: "dark", node: "card", min: 7 },
    { kind: "contrast", node: "card-title", min: 7 },
    { kind: "contrast", node: "card-sub", min: 4.5 },
  ],
};

const near = (a: number, b: number) => Math.abs(a - b) <= 0.5;
const px = (v: number) => `${Math.round(v * 10) / 10}`;
const fillColors = (fill: Fill | null) => (!fill ? [] : fill.type === "solid" ? [fill.color] : fill.stops.map((s) => s.color));
const describeFill = (fill: Fill | null) => (!fill ? "empty" : fill.type === "solid" ? `solid ${fill.color.toUpperCase()}` : "a linear gradient");

/** What a text sits on: its own fill, or the fill of the layer it belongs to. */
function behind(scene: DesignScene, node: SceneNode): Fill | null {
  if (node.fill) return node.fill;
  return scene.nodes.find((n) => n.id === node.parentId)?.fill ?? null;
}

/** The weakest contrast between a colour and every colour of a fill; null when a colour can't be read. */
function worst(color: string | null, fill: Fill | null): number | null {
  const colors = fillColors(fill);
  if (!color || !colors.length) return null;
  const ratios = colors.map((c) => contrastRatio(color, c));
  return ratios.every((r) => r !== null) ? Math.min(...(ratios as number[])) : null;
}

function one(rule: DesignRule, scene: DesignScene): Omit<Check, "id" | "by"> {
  const find = (id: string) => scene.nodes.find((n) => n.id === id);
  const ids = "nodes" in rule ? rule.nodes : [rule.node];
  const nodes = ids.map(find);
  const missing = ids.filter((_, i) => !nodes[i]);
  const name = (id: string) => find(id)?.name ?? id;
  if (missing.length) return { label: `The layer "${missing[0]}" is still there`, passed: false, message: "It was deleted or renamed." };
  const n = nodes[0]!;
  const frame = scene.nodes.find((f) => f.type === "frame" && f.parentId === null);

  switch (rule.kind) {
    case "radius":
      return { label: `${n.name}: corner radius ${rule.value}`, passed: near(n.radius, rule.value), message: `The radius is ${px(n.radius)}.` };
    case "fill": {
      const want = rule.type === "linear" ? "a linear gradient" : rule.color ? `solid ${rule.color}` : "a solid colour";
      const ok = n.fill?.type === rule.type && (!rule.color || (n.fill.type === "solid" && n.fill.color.toUpperCase() === rule.color.toUpperCase()));
      return { label: `${n.name}: fill is ${want}`, passed: ok, message: `The fill is ${describeFill(n.fill)}.` };
    }
    case "contrast": {
      const ratio = worst(n.textColor, behind(scene, n));
      return {
        label: `${n.name}: text contrast at least ${rule.min}:1`,
        passed: ratio !== null && ratio >= rule.min,
        message: ratio === null ? "Couldn't read the text or fill colours." : `The weakest part gives ${ratio.toFixed(1)}:1.`,
      };
    }
    case "fontSize":
      return { label: `${n.name}: text size ${rule.value}`, passed: n.fontSize !== null && near(n.fontSize, rule.value), message: `The size is ${n.fontSize ?? "not set"}.` };
    case "left": {
      const off = nodes.filter((m) => !near(m!.x, rule.x));
      return {
        label: `${ids.map(name).join(", ")} start at x ${rule.x}`,
        passed: off.length === 0,
        message: `Not yet: ${off.map((m) => `${m!.name} at ${px(m!.x)}`).join(", ")}.`,
      };
    }
    case "size": {
      const off = nodes.filter((m) => (rule.width !== undefined && !near(m!.width, rule.width)) || (rule.height !== undefined && !near(m!.height, rule.height)));
      const want = rule.width !== undefined && rule.height !== undefined ? `${rule.width} × ${rule.height}` : rule.width !== undefined ? `${rule.width} wide` : `${rule.height} tall`;
      return {
        label: `${ids.length > 1 ? "Every row" : n.name} stays ${want}`,
        passed: off.length === 0,
        message: `Changed: ${off.map((m) => `${m!.name} is ${px(m!.width)} × ${px(m!.height)}`).join(", ")}.`,
      };
    }
    case "minSize":
      return {
        label: `${n.name}: at least ${rule.width} × ${rule.height}`,
        passed: n.width >= rule.width - 0.5 && n.height >= rule.height - 0.5,
        message: `It's ${px(n.width)} × ${px(n.height)}.`,
      };
    case "rightEdge":
      return { label: `${n.name}: right edge at x ${rule.x}`, passed: near(n.x + n.width, rule.x), message: `It ends at ${px(n.x + n.width)}.` };
    case "inside": {
      const ok = !!frame && n.x >= -0.5 && n.y >= -0.5 && n.x + n.width <= frame.width + 0.5 && n.y + n.height <= frame.height + 0.5;
      return { label: `${n.name} stays inside the screen`, passed: ok, message: "Part of it is off the screen." };
    }
    case "gaps": {
      const gaps = nodes.slice(1).map((m, i) => m!.y - (nodes[i]!.y + nodes[i]!.height));
      return { label: `${rule.gap} px between every two rows`, passed: gaps.every((g) => near(g, rule.gap)), message: `The gaps are ${gaps.map(px).join(", ")}.` };
    }
    case "centerX": {
      const left = n.x;
      const right = (frame?.width ?? scene.width) - (n.x + n.width);
      return { label: `${n.name} is centred horizontally`, passed: Math.abs(left - right) <= 1, message: `${px(left)} px on the left, ${px(right)} px on the right.` };
    }
    case "dark": {
      const ratio = worst("#FFFFFF", n.fill);
      return {
        label: `${n.name}: fill dark enough for white text (${rule.min}:1)`,
        passed: ratio !== null && ratio >= rule.min,
        message: ratio === null ? "Couldn't read the fill colour." : `White on it gives ${ratio.toFixed(1)}:1.`,
      };
    }
  }
}

/** One check per rule. Ids are the rule kind, with the layer id added when a kind repeats. */
export function checkDesign(scene: DesignScene, rules: DesignRule[]): Check[] {
  const count = new Map<string, number>();
  for (const r of rules) count.set(r.kind, (count.get(r.kind) ?? 0) + 1);
  return rules.map((rule) => {
    const result = one(rule, scene);
    const id = (count.get(rule.kind) ?? 0) > 1 ? `${rule.kind}-${"node" in rule ? rule.node : rule.nodes[0]}` : rule.kind;
    return { id, by: "code" as const, ...result, message: result.passed ? null : result.message };
  });
}
