import { NextResponse } from "next/server";
import type { z } from "zod";

// Small helpers shared by the route handlers in src/app/api.

export function errorJson(status: number, error: string, extra?: Record<string, string>) {
  return NextResponse.json({ error }, { status, headers: extra });
}

/** Reads a JSON body and validates it. On failure returns a ready 400 response. */
export async function readJson<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: Response }> {
  const body = await request.json().catch(() => undefined);
  if (body === undefined) return { ok: false, response: errorJson(400, "The request body is not valid JSON.") };
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.length ? ` at ${first.path.join(".")}` : "";
    return { ok: false, response: errorJson(400, `The request doesn't match the contract${where}: ${first?.message ?? "invalid"}.`) };
  }
  return { ok: true, data: parsed.data };
}

/** Client IP as Caddy forwards it; "local" in development. */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}
