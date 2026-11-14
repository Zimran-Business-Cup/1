// GET /api/health — liveness check for the Docker healthcheck and the deploy
// script. It answers as soon as the Next.js server is up.
export function GET() {
  return Response.json({ ok: true });
}
