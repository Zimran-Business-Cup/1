import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SubmissionSchema } from "@/contracts/task";
import { saveAttempt } from "@/server/db/repo";
import { gradeSubmission } from "@/server/grading";
import { errorJson, readJson } from "@/server/http";
import { userId } from "@/server/identity";
import { getPublicTask } from "@/server/tasks/store";

// POST /api/tasks/:id/submit  Submission → GradeResult (src/contracts/task.ts).
export async function POST(request: NextRequest, ctx: RouteContext<"/api/tasks/[id]/submit">) {
  const { id } = await ctx.params;
  const task = getPublicTask(id);
  if (!task) return errorJson(404, `No task with id "${id}".`);

  const body = await readJson(request, SubmissionSchema);
  if (!body.ok) return body.response;
  if (body.data.taskId !== id) return errorJson(400, "taskId in the body doesn't match the URL.");

  const result = await gradeSubmission(task, body.data);
  if ("error" in result) return errorJson(400, result.error);
  await saveAttempt(await userId(), task, body.data, result);
  return NextResponse.json(result);
}
