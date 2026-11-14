# heforage

Try a new career before you commit. heforage lets US adults who are thinking about a career switch (say, an accountant curious about tech) open a session for a role, read what the job involves and what it pays, take a one-minute level quiz, and do the real tasks a junior does in week one with an AI mentor. At the end the mentor gives an honest fit verdict, and the learner can compare roles in parallel sessions.

## What works

- **Catalog**: 3 directions (Programming, Design & marketing, Management), 9 roles.
- **Role brief**: duties, qualifications, skills, and US pay from BLS OEWS May 2025 (percentiles, top-paying metros, employer types), with sources.
- **Mentor session per role**: intro → level quiz → real tasks → fit check → verdict. Several sessions can be open at once.
- **In-chat practice**: Python (Pyodide) and JavaScript run in a browser Web Worker with automatic checks; written tasks for design, marketing and management roles.
- **Paywall**: the first task in every role is free; Pro is $20 the first month, then $35/month (demo checkout, no charge).

## Run it

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for the AI mentor
npm run dev
```

Without `ANTHROPIC_API_KEY` the server answers with a built-in demo mentor (labelled "Demo mentor" in the UI). It reacts to the learner's real answers and real test results, but uses a fixed bank of questions and tasks.

## How it works

| Part | Where |
|---|---|
| Roles, briefs | `src/lib/catalog.ts` |
| Pay data (BLS OEWS May 2025) | `src/lib/pay.ts` |
| Mentor API (Claude, structured output) | `src/app/api/tutor/route.ts`, `src/lib/tutor/` |
| Demo mentor (no key) | `src/lib/tutor/demo.ts` |
| Browser code runner | `src/lib/runner.ts` |
| Sessions (localStorage for now, Supabase next) | `src/lib/sessions.ts` |
| UI | `src/components/` |

Dependencies: Next.js 16, React 19, Tailwind CSS 4, `@anthropic-ai/sdk` (model `claude-opus-5-5`, server-side refusal fallback enabled), Pyodide 0.28 from jsDelivr, CodeMirror, Fluent 3D emoji (MIT) from jsDelivr.

Learner code never reaches the server: it runs in a Web Worker with network APIs removed. The API key stays on the server; the mentor endpoint is rate-limited per IP.

## Architecture

Where the product is going and who builds what: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The browser and the server talk through the zod contracts in `src/contracts`.

## Credits

The voice cursor assistant is a web port of [Flicky](https://github.com/pango07/flicky) by Julio Vaught and contributors (MIT, see `third_party/flicky/LICENSE`), itself inspired by [Clicky](https://github.com/farzaa/clicky) by Farza.
