# deploy

```bash
cp deploy/.env.example deploy/.env    # set POSTGRES_PASSWORD, keys and SITE_ADDRESS
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml ps
```

With `SITE_ADDRESS=:80` Caddy serves plain HTTP, which is enough locally (set `HTTP_PORT` if port 80 is taken). In production set `SITE_ADDRESS` to the domain, point its A record at the server and keep ports 80 and 443 open; Caddy obtains and renews the certificate.

| File | Purpose |
|---|---|
| `Dockerfile` | Next.js standalone build, runs as `node`, healthcheck on `/api/health` |
| `docker-compose.yml` | `caddy`, `app`, `postgres`, `runner`, `tts`; only Caddy publishes ports |
| `Caddyfile` | reverse proxy, 30 MB request limit for voice uploads |
| `.env.example` | settings and keys |

Inspect the data:

```bash
docker compose -f deploy/docker-compose.yml exec postgres psql -U heforage -d heforage -c "select role, level, goal from profiles"
```
