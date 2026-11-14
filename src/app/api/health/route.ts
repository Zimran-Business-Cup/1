import { connection } from "next/server";
import { dbStatus } from "@/server/db";

// GET /api/health — liveness check for the Docker healthcheck and the deploy
// script. Answers 200 while the server is up; `db` says whether Postgres is
// "up", "down" or "off" (no DATABASE_URL).
export async function GET() {
  await connection(); // always run at request time, never prerender
  return Response.json({ ok: true, db: await dbStatus() });
}
