# deploy/ — owner: Anuar

Everything that runs the product on our own VPS. No Vercel, no Supabase.

## Run it

```bash
cp deploy/.env.example deploy/.env     # set POSTGRES_PASSWORD, keys, ports
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml ps
```

Locally, with `SITE_ADDRESS=:80` and `HTTP_PORT=8080`, the app is at http://localhost:8080. On the server, set `SITE_ADDRESS` to the domain (its A record must point at the server) and keep ports 80/443: Caddy gets and renews the HTTPS certificate on its own.

Stop: `docker compose -f deploy/docker-compose.yml down` (add `-v` only if you want to wipe the database).

Look at the data:

```bash
docker compose -f deploy/docker-compose.yml exec postgres psql -U heforage -d heforage -c "select role, level, goal from profiles"
```

The app runs its migrations itself on the first query, and `/api/health` shows `"db": "up"` once Postgres answers.

## Files

| File | What it does |
|---|---|
| `Dockerfile` | builds Next.js with `output: "standalone"`, runs `server.js` as the `node` user, healthcheck on `/api/health` (image ≈ 420 MB) |
| `docker-compose.yml` | `caddy` (only public service), `app`, `postgres` with a healthcheck; app waits for Postgres, Caddy waits for a healthy app |
| `Caddyfile` | proxy to `app:3000`, 30 MB request limit for voice uploads, no `Server` header; SSE streams pass through unbuffered |
| `.env.example` | `SITE_ADDRESS`, `HTTP_PORT`, `HTTPS_PORT`, `POSTGRES_PASSWORD`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY` |

Coming next: `runner` (code sandbox) and `tts` (Kokoro-82M) services, and a deploy workflow (build → GHCR → SSH → `docker compose pull && up -d`).

Checked locally: stack up in under a minute; pages, static files, `/api/tasks`, the demo mentor, a 5 MB upload and the Flicky SSE stream (chunks arrive every ~40 ms) all work through Caddy.
