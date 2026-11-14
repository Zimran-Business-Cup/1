# Brief: Anuar — server, infra, AI on the server

For Anuar and any assistant tool he works with. Commits go from the GitHub account `alpabruh` as "Alpamys Beissenbek".

Whole picture: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).

## Your zone

**Edit:** `deploy/`, `runner/`, `.github/`, `src/app/api/**`, `src/server/**`, `src/lib/tutor/**`, `src/lib/rate-limit.ts`, `content/tasks/`.

**Never edit** (Alsheri's zone): `src/app/**` pages/layouts/globals.css, `src/components/**`, `src/lib/flicky/**`, `src/lib/runner.ts`, `src/lib/sessions.ts`, `src/lib/api.ts`, `src/lib/features.ts`, `public/`.

**Shared, small PR reviewed by Alsheri:** `src/contracts/**`, `src/lib/catalog.ts`, `src/lib/pay.ts`, `package.json` + lockfile, `AGENTS.md`, `README.md`, `docs/`.

## Build order

1. **Contracts PR (by 22:30).** `TutorTurn`: `stage: "interview"` replaces `"quiz"`, `task: TaskCard | null` replaces the inline exercise; move the schema into `src/contracts/tutor.ts`. Agree it with Alsheri.
2. **Stubs (by 23:30).** `GET /api/tasks/[id]`, `POST /api/tasks/[id]/submit`, `POST /api/flicky/{transcribe,ask,speak}`, `POST /api/events` returning fixtures from `src/contracts/fixtures`. `/ask` streams `gradientAnswer`/`doublePayAnswer` as SSE.
3. **Interview + task cards in `/api/tutor`.** Prompt and demo mentor run the interview, return a profile, then a `TaskCard` built from a seed task.
4. **Self-host.** `deploy/`: Dockerfile (Next.js `output: "standalone"`), compose (`caddy`, `app`, `postgres`, `runner`, `tts`), Caddyfile with SSE passthrough, deploy workflow. Works locally with `docker compose up` before the VPS exists.
5. **Postgres.** Schema for profiles, sessions, messages, tasks (with private parts), attempts, guide_steps, ratings, run_queue.
6. **Runner (sync 05:30).** Hidden tests on Submit, self-check of generated tasks; limits from ARCHITECTURE §10.
7. **Grading.** Code checks for scenes (fill type, radius, contrast) and boards (capacity, P0s in sprint, dependencies); model explanation and rubric checks for the report.
8. **Flicky server (sync 08:30).** Port `prompts.ts` + the model call from Flicky to `src/server/flicky`, add anchors and task context to the prompt, stream SSE, parse with `parseFlickyAnswer` and drop unknown anchors. Groq Whisper for `/transcribe` (free tier), Kokoro container for `/speak`; measure Kokoro latency on the VPS, switch to OpenAI TTS if a sentence takes > 2 s.
9. **Hardening.** Rate limits per anonymous id, nightly `pg_dump`, README credits for Flicky.

## Rules

- Keys (`ANTHROPIC_API_KEY`, `GROQ_API_KEY`) live only in server env. Without the Anthropic key the demo mentor must still work end to end.
- `passed` comes only from code checks; the model explains.
- Read `node_modules/next/dist/docs/` before Next-specific code (route handlers, caching, config) — see `AGENTS.md`.
