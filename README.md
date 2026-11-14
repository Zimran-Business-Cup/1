# 1ry-space

Try a new career before you commit. 1ry-space lets US adults who are thinking about a career switch (say, an accountant curious about tech) open a session for a role, read what the job involves and what it pays, take a one-minute level quiz, and do the real tasks a junior does in week one with an AI mentor. At the end the mentor gives an honest fit verdict, and the learner can compare roles in parallel sessions.

## What works

- **Catalog**: 3 directions (Programming, Design & marketing, Management), 9 roles.
- **Role brief**: duties, qualifications, skills, and US pay from BLS OEWS May 2025 (percentiles, top-paying metros, employer types), with sources.
- **Mentor session per role**: a short interview, then real tasks, a fit check and a verdict. Several sessions can be open at once.
- **Practice**: Python (Pyodide) and JavaScript run in a browser Web Worker against visible tests. On Submit, hidden tests run on the server in a throwaway sandbox container; design and sprint-board tasks are graded by rule checks.
- **Flicky**: a voice assistant that answers questions about the task and points at the interface (speech-to-text with Groq Whisper, text-to-speech with Kokoro).
- **Paywall**: the first task in every role is free; Pro is $20 the first month, then $35/month (demo checkout, no charge).

## Run it

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for the AI mentor
npm run dev
```

Without `ANTHROPIC_API_KEY` the server answers with a built-in demo mentor (labelled "Demo mentor" in the UI). It reacts to the learner's real answers and real test results, but uses a fixed bank of questions and tasks.

The full stack (Caddy, app, Postgres, sandbox runner, Kokoro) runs with Docker Compose:

```bash
cp deploy/.env.example deploy/.env   # set POSTGRES_PASSWORD and keys
docker compose -f deploy/docker-compose.yml up -d --build
```

## How it works

| Part | Where |
|---|---|
| Roles, briefs | `src/lib/catalog.ts` |
| Pay data (BLS OEWS May 2025) | `src/lib/pay.ts` |
| Mentor API (Claude, structured output) | `src/app/api/tutor/route.ts`, `src/lib/tutor/` |
| Demo mentor (no key) | `src/lib/tutor/demo.ts` |
| API contracts (zod) | `src/contracts/` |
| Tasks, grading, Flicky, database | `src/server/` |
| Browser code runner | `src/lib/runner.ts` |
| Server-side sandbox | `runner/` |
| Text-to-speech | `tts/` |
| Deployment | `deploy/` |
| Sessions (localStorage) | `src/lib/sessions.ts` |
| UI | `src/components/` |

Dependencies: Next.js 16, React 19, Tailwind CSS 4, `@anthropic-ai/sdk` (model `claude-opus-5-5`, server-side refusal fallback enabled), Postgres via `postgres`, Pyodide 0.28 from jsDelivr, CodeMirror, Fluent 3D emoji (MIT) from jsDelivr.

API keys stay on the server, and the mentor and Flicky endpoints are rate-limited per IP.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

The voice cursor assistant is a web port of [Flicky](https://github.com/pango07/flicky) by Julio Vaught and contributors (MIT, see `third_party/flicky/LICENSE`), itself inspired by [Clicky](https://github.com/farzaa/clicky) by Farza.
