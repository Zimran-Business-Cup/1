import { connection } from "next/server";
import { aiProvider } from "@/server/ai";
import { dbStatus } from "@/server/db";

// GET /api/health  liveness for Docker; `db` is "up", "down" or "off", `ai` the model provider or "demo".
export async function GET() {
  await connection(); // always run at request time, never prerender
  return Response.json({ ok: true, db: await dbStatus(), ai: aiProvider ?? "demo" });
}
