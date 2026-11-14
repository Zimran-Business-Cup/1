# src/lib/flicky/ — owner: Alsheri

The web version of Flicky's Electron bridge (`window.flicky`) plus the anchor registry.

| File | What it does |
|---|---|
| `bridge.ts` | implements the `window.flicky` methods the ported UI uses (see docs/team/alsheri.md for the list): hold-to-talk on Ctrl+Alt+X, mic capture, calls to `/api/flicky/transcribe`, `/ask` (SSE), `/speak`, walkthrough runner, audio playback with `speechSynthesis` fallback |
| `anchors.ts` | `useAnchor(id, label, role)` hook; keeps a live map id → element so the overlay can read its position |
| `snapshot.ts` | JPEG of the workspace (html-to-image for DOM, `canvas.toDataURL` for the design canvas), longest side ≤ 1600 px |

Walkthrough rule: on a task, a step waits until the learner clicks the target; for "where is X?" answers it advances on Flicky's timer (`dwellMs` in `src/contracts/flicky.ts`).
