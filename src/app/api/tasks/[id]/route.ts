import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { errorJson } from "@/server/http";
import { getPublicTask } from "@/server/tasks/store";

// GET /api/tasks/:id → PublicTask (src/contracts/task.ts).
// Serves the fixture tasks until generated tasks are stored in Postgres.
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;
  const task = getPublicTask(id);
  if (!task) return errorJson(404, `No task with id "${id}".`);
  return NextResponse.json(task);
}
