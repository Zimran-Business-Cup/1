import { cookies } from "next/headers";

// Anonymous learner id in an httpOnly cookie. Call it before a response starts streaming.

const COOKIE = "uid";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function userId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && UUID.test(existing)) return existing;
  const id = crypto.randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.SITE_ADDRESS !== ":80",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}
