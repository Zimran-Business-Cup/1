# deploy/ — owner: Anuar

Everything that runs the product on our own VPS. No Vercel, no Supabase.

Planned files:

| File | What it does |
|---|---|
| `Dockerfile` | builds Next.js in `output: "standalone"` mode |
| `docker-compose.yml` | `caddy`, `app`, `runner`, `postgres`, `tts` on one internal network |
| `Caddyfile` | HTTPS (Let's Encrypt), proxy to `app`, streaming (SSE) passthrough |
| `kokoro/` | Kokoro-82M TTS container used by `/api/flicky/speak` |
| `.env.example` | server env: `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `DATABASE_URL`, `RUNNER_URL`, `TTS_URL` |

Only Caddy publishes ports (80, 443). See docs/ARCHITECTURE.md → "Infrastructure".
