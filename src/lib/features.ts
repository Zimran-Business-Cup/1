import type { WorkspaceKind } from "@/contracts/workspace";
import { DIRECTIONS, PROFESSIONS, type DirectionId } from "./catalog";

// UI feature flags. Unfinished pieces stay hidden so `main` is always deployable.

/** Roles that open a session. The rest show "Coming soon" in the catalog. */
export const MVP_ROLES: string[] = ["backend-engineer", "product-designer"];
export const isRoleOpen = (slug: string) => MVP_ROLES.includes(slug);

/** Display names that differ from the catalog. */
const ROLE_LABELS: Record<string, string> = {
  "product-designer": "UI/Product designer",
};
export const roleName = (p: { slug: string; name: string }) => ROLE_LABELS[p.slug] ?? p.name;

/** Directions hidden from the home page and the role catalog. */
export const HIDDEN_DIRECTIONS: DirectionId[] = ["management"];

export const VISIBLE_DIRECTIONS = DIRECTIONS.filter((d) => !HIDDEN_DIRECTIONS.includes(d.id));
export const VISIBLE_PROFESSIONS = PROFESSIONS.filter((p) => !HIDDEN_DIRECTIONS.includes(p.direction));

/** Workspaces that open full screen from a task card. The others still show
 *  the task inline in the chat until their tool is built. */
export const WORKSPACE_READY: Record<WorkspaceKind, boolean> = {
  code: true,
  design: true,
  board: false,
};
