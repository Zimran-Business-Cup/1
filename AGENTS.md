<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Team zones

Two developers work in this repo at the same time. Edit only the zone of the person you are working for; their brief in `docs/team/` lists it. If you don't know whose session this is, ask before editing.

| Zone | Owner | Paths |
|---|---|---|
| UI | Alsheri | `src/app/**` pages, layouts and `globals.css`; `src/components/**`; `src/lib/flicky/**`, `src/lib/runner.ts`, `src/lib/sessions.ts`, `src/lib/api.ts`, `src/lib/features.ts`; `public/**` |
| Server and infra | Anuar | `src/app/api/**`, `src/server/**`, `src/lib/tutor/**`, `src/lib/rate-limit.ts`, `deploy/`, `runner/`, `.github/`, `content/tasks/` |
| Shared | both, by small PR | `src/contracts/**`, `src/lib/catalog.ts`, `src/lib/pay.ts`, `package.json`, `package-lock.json`, `AGENTS.md`, `README.md`, `docs/` |

Rules:

- A change outside your zone: stop and say what the owner needs to do. Don't work around it.
- The browser and the server talk only through `src/contracts` (zod schemas). Change a contract in its own small PR.
- New dependency: its own commit. Lockfile conflict: take `main`'s lockfile, run `npm install`; never hand-merge it.
- `main` must always build: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Code copied from Flicky keeps its MIT header and is listed in `third_party/flicky/README.md`.
- Architecture and decisions: `docs/ARCHITECTURE.md`.
