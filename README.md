# 1ry-space

Try a new career before you commit. 1ry-space lets US adults who are thinking about a career switch (say, an accountant curious about tech) do the real work a junior does in week one, with an AI mentor and a voice assistant that points at the screen, and find out whether they like it before paying for a course.

**Live: https://1ry.space**

## Try it in 2 minutes

1. Open https://1ry.space and pick **Backend engineer** (or **UI/Product designer**).
2. Answer the mentor's four short questions. Your first task appears as a card, picked from your answers.
3. **Open** it: edit the code, **Run** it in the browser against the visible tests, then **Submit** to run the hidden tests on the server.
4. Stuck? Hold **Ctrl+Alt+X** (⌃⌥X on a Mac), ask out loud and circle the confusing spot with the mouse, then let go. **Space** answers by voice and walks the cursor through the steps. You can also type the question.
5. After the free task, **Go Pro** opens Stripe Checkout in test mode: card `4242 4242 4242 4242`, any future date and CVC. Nothing is charged.

No sign-up: each browser gets an anonymous id, and sessions are kept in the browser.

## What works

- **Roles.** Backend engineer: Python and JavaScript task ladders, from printing a line to fixing a double payment. UI/Product designer: ten design-system tasks on a Figma-like canvas. Four more roles are listed as coming soon, and management roles (Project manager) come next. Each role has a brief with US pay from BLS OEWS May 2025.
- **Mentor.** A short interview, then the server picks the first task from the answers; the mentor gives hints, never the full solution, and ends with a fit verdict.
- **Grading by code.** Hidden tests run in a one-off sandbox container per attempt (gVisor, no network, read-only, 256 MB, 10 s). Design tasks are checked by rules: radius, fill, contrast, type scale, alignment, spacing, tap size. The model explains the result; it never decides pass or fail.
- **Space.** Voice in, voice out: Whisper on Groq for speech-to-text, Kokoro-82M on our own server for the voice. The cursor points at real elements on the page, or at a spot on a captured screenshot when the learner circled one.
- **Payments.** Stripe Checkout in test mode: $20 the first month, then $35 a month.

## How it works

One VPS with Docker Compose: Caddy (HTTPS) in front of the Next.js app, with Postgres, the sandbox runner and the Kokoro TTS service on an internal network without internet access. The mentor and Space use DeepSeek V4.1 Flash through OpenRouter, or Claude when `ANTHROPIC_API_KEY` is set. Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| Part | Where |
|---|---|
| Roles, briefs, pay data | `src/lib/catalog.ts`, `src/lib/pay.ts` |
| API contracts (zod) | `src/contracts/` |
| Mentor | `src/app/api/tutor/route.ts`, `src/lib/tutor/` |
| Model providers (Anthropic, OpenRouter) | `src/server/ai/` |
| Tasks and ladders | `src/contracts/fixtures/`, `src/server/tasks/` |
| Grading | `src/server/grading/`, `runner/` |
| Space | `src/components/flicky/`, `src/lib/flicky/`, `src/server/flicky/`, `tts/` |
| Workspaces | `src/components/workspace/` |
| Payments | `src/server/billing/`, `src/app/api/checkout/` |
| Database | `src/server/db/` |
| Deployment | `deploy/` |

## Run it

```bash
npm install
cp .env.example .env.local   # OPENROUTER_API_KEY or ANTHROPIC_API_KEY, optionally GROQ_API_KEY
npm run dev
```

Without keys the app still works end to end: a scripted demo mentor, recorded Space answers and the browser's voice.

The full stack runs with Docker Compose:

```bash
cp deploy/.env.example deploy/.env   # POSTGRES_PASSWORD and keys
docker compose -f deploy/docker-compose.yml up -d --build
```

Keys stay on the server; the model, voice and checkout endpoints are rate-limited per IP.

## How we built it

Two developers worked in parallel on the UI and on the server, with ownership and rules in [CONTRIBUTING.md](CONTRIBUTING.md). Every change went through a pull request with CI (types, lint, build, Docker images) and was squash-merged into `main`, which deploys to the server. See the [merged pull requests](https://github.com/Zimran-Business-Cup/1/pulls?q=is%3Apr+is%3Amerged), for example the [sandbox runner](https://github.com/Zimran-Business-Cup/1/pull/7), the [task ladders](https://github.com/Zimran-Business-Cup/1/pull/12), the [workspaces and Space](https://github.com/Zimran-Business-Cup/1/pull/13) and [circling a question](https://github.com/Zimran-Business-Cup/1/pull/17).

## Credits

Space is a web port of [Flicky](https://github.com/pango07/flicky) by Julio Vaught and contributors (MIT, see `third_party/flicky/`), itself inspired by [Clicky](https://github.com/farzaa/clicky) by Farza. Voice: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache 2.0). Pay data: [BLS OEWS](https://www.bls.gov/oes/), May 2025.
