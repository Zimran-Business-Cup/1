# Brief: Anuar — server, infra, AI on the server

For Anuar and any assistant tool he works with. Commits go from the GitHub account `alpabruh` as "Alpamys Beissenbek".

Whole picture: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).

## Your zone

**Edit:** `deploy/`, `runner/`, `.github/`, `src/app/api/**`, `src/server/**`, `src/lib/tutor/**`, `src/lib/rate-limit.ts`, `content/tasks/`.

**Never edit** (Alsheri's zone): `src/app/**` pages/layouts/globals.css, `src/components/**`, `src/lib/flicky/**`, `src/lib/runner.ts`, `src/lib/sessions.ts`, `src/lib/api.ts`, `src/lib/features.ts`, `public/`.

**Shared, small PR reviewed by Alsheri:** `src/contracts/**`, `src/lib/catalog.ts`, `src/lib/pay.ts`, `package.json` + lockfile, `AGENTS.md`, `README.md`, `docs/`.

## Build order

1. ✓ **Contracts PR.** Zones, contracts, fixtures, CI.
2. ✓ **Stubs.** Every endpoint answers with the contract shapes; design and board grading is real.
3. ✓ **Interview + task cards in `/api/tutor`.** Interview in stage `intro` for MVP roles, `profile` on the last interview turn, `task` attached by the server, `exercise` kept for the old UI. Stage enum unchanged so `STAGE_LABEL` in the UI still compiles; move the schema into `src/contracts/tutor.ts` once Alsheri drops the quiz stage.
4. ✓ **Self-host.** Dockerfile, compose (`caddy`, `app`, `postgres`), Caddyfile, CI image build. Still to add: `runner` and `tts` services, the deploy workflow.
5. ✓ **Postgres.** Anonymous id cookie, migrations, `users`, `profiles`, `attempts`, `events`; best-effort writes. Still to add: `tasks` and `run_queue` with the runner, sessions on the server once the UI moves off localStorage.
6. ✓ **Runner.** Hidden tests on Submit in one-off sandbox containers; the double-pay solution passes all four checks, the starter fails two. Still to add: self-check of model-generated variants before handing them out.
7. **Grading.** Code checks for scenes (fill type, radius, contrast) and boards (capacity, P0s in sprint, dependencies); model explanation and rubric checks for the report.
8. ✓ **Flicky server.** Flicky prompt ported, `/ask` streams the model with image + anchors + task, Groq Whisper for `/transcribe`, Kokoro container for `/speak` (0.4–1.6 s locally). Still to do: check with real keys, and measure Kokoro on the VPS.
9. **Hardening.** Rate limits per anonymous id, nightly `pg_dump`, README credits for Flicky.

## Rules

- Keys (`ANTHROPIC_API_KEY`, `GROQ_API_KEY`) live only in server env. Without the Anthropic key the demo mentor must still work end to end.
- `passed` comes only from code checks; the model explains.
- Read `node_modules/next/dist/docs/` before Next-specific code (route handlers, caching, config) — see `AGENTS.md`.
