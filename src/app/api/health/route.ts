import { connection } from "next/server";
import { dbStatus } from "@/server/db";

// GET /api/health  liveness for Docker; `db` is "up", "down" or "off".
export async function GET() {
  await connection(); // always run at request time, never prerender
  return Response.json({ ok: true, db: await dbStatus() });
}
