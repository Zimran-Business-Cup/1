import type postgres from "postgres";
import type { AppEvent } from "@/contracts/events";
import type { GradeResult, PublicTask, Submission } from "@/contracts/task";
import type { Profile } from "@/lib/tutor/schema";
import { bestEffort } from "./index";

// Best-effort writes: a database error is logged and never fails the request.

type Tx = postgres.TransactionSql;

async function touchUser(tx: Tx, userId: string) {
  await tx`insert into users (id) values (${userId})
           on conflict (id) do update set last_seen_at = now()`;
}

export function saveProfile(userId: string, role: string, profile: Profile, level: string | null) {
  return bestEffort("save profile", (sql) =>
    sql.begin(async (tx) => {
      await touchUser(tx, userId);
      await tx`
        insert into profiles (user_id, role, current_job, experience, tools, hours_per_week, goal, level)
        values (${userId}, ${role}, ${profile.currentJob}, ${profile.experience}, ${tx.array(profile.tools)},
                ${profile.hoursPerWeek}, ${profile.goal}, ${level})
        on conflict (user_id, role) do update set
          current_job = excluded.current_job, experience = excluded.experience, tools = excluded.tools,
          hours_per_week = excluded.hours_per_week, goal = excluded.goal, level = excluded.level,
          updated_at = now()`;
    }),
  );
}

export function saveAttempt(userId: string, task: PublicTask, submission: Submission, grade: GradeResult) {
  return bestEffort("save attempt", (sql) =>
    sql.begin(async (tx) => {
      await touchUser(tx, userId);
      await tx`
        insert into attempts (user_id, task_id, role, workspace, passed, checks, submission)
        values (${userId}, ${task.card.id}, ${task.card.role}, ${task.card.workspace}, ${grade.passed},
                ${tx.json(grade.checks)}, ${tx.json(submission)})`;
    }),
  );
}

export function saveEvent(userId: string, event: AppEvent) {
  const { type, sessionId, taskId, ...payload } = event;
  return bestEffort("save event", (sql) =>
    sql.begin(async (tx) => {
      await touchUser(tx, userId);
      await tx`
        insert into events (user_id, session_id, task_id, type, payload)
        values (${userId}, ${sessionId}, ${taskId}, ${type}, ${tx.json(payload)})`;
    }),
  );
}
