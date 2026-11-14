# Contributing

## Ownership

| Area | Paths |
|---|---|
| UI | `src/app/**` pages and layouts, `src/components/**`, `src/lib/{flicky,runner,sessions,api,features}*`, `public/` |
| Server | `src/app/api/**`, `src/server/**`, `src/lib/tutor/**`, `src/lib/rate-limit.ts` |
| Infra | `deploy/`, `runner/`, `tts/`, `.github/` |
| Shared | `src/contracts/**`, `src/lib/catalog.ts`, `src/lib/pay.ts`, `package.json`, docs |

The UI and the server talk only through the zod schemas in `src/contracts`. Changes to shared files go in their own small PR and need a review from the other side.

## Workflow

- Short-lived branches, one PR per change, squash-merged into `main`.
- `main` must stay deployable: `npx tsc --noEmit`, `npm run lint` and `npm run build` pass in CI.
- Add a dependency in its own commit. On a lockfile conflict, take `main`'s `package-lock.json` and run `npm install`.
- Code adapted from Flicky keeps its MIT notice and is listed in `third_party/flicky/README.md`.
