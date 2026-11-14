# Brief: Alsheri — everything the learner sees

This file is for Alsheri and for any assistant tool he works with. Read [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) for the whole picture. This file says what is yours and in which order to build it.

## Your zone

You (and your agent) **edit only these paths**:

- `src/app/**` pages and layouts (`page.tsx`, `layout.tsx`, `s/[slug]/…`) and `src/app/globals.css`
- `src/components/**` — chat (`session/`), `workspace/`, `flicky/`
- `src/lib/flicky/**`, `src/lib/runner.ts`, `src/lib/sessions.ts`, `src/lib/api.ts`, `src/lib/features.ts`
- `public/**`

**Never edit** (Anuar's zone): `src/app/api/**`, `src/server/**`, `src/lib/tutor/**`, `src/lib/rate-limit.ts`, `deploy/`, `runner/`, `.github/`, `content/tasks/`.

**Shared, only through a small separate PR that Anuar reviews:** `src/contracts/**`, `src/lib/catalog.ts`, `src/lib/pay.ts`, `package.json` + lockfile, `AGENTS.md`, `README.md`, `docs/`.

If a task needs a change outside your zone, stop and tell Alsheri what to ask Anuar for (endpoint, field, contract change). Don't work around it.

## How you talk to the server

Only through the endpoints and types in `src/contracts`. Put typed fetch wrappers in `src/lib/api.ts` (e.g. `getTask(id): Promise<PublicTask>`, `submitTask(id, s): Promise<GradeResult>`, `askFlicky(req, onEvent)`), validating responses with the zod schemas.

Until Anuar's stubs land (target 23:30), use the fixtures directly: `src/contracts/fixtures/tasks.ts` (`doublePayTask`, `payButtonTask`, `sprintAtRiskTask`, `passedGrade`) and `src/contracts/fixtures/flicky.ts` (`gradientAnswer`, `doublePayAnswer` + anchors; feed them to `parseFlickyAnswer`).

## Build order

Each item has a "done when". Keep `main` deployable: hide unfinished UI behind flags in `src/lib/features.ts`.

### 1. Three MVP roles (≈30 min)
Programming → Backend engineer, Design → Product designer (shown as "UI/Product designer"), Management → Project manager are clickable; the other six show "Coming soon". Keep the list in `src/lib/features.ts` (`MVP_ROLES`) so you don't have to touch the shared `catalog.ts`.
**Done when** only the three roles open a session.

### 2. Interview UI (≈30 min, together with Anuar's prompt change)
Anuar replaces the quiz with an interview in `/api/tutor` (new stage `"interview"`). You update the stage chips in `SessionView.tsx` and keep quick replies working.
**Done when** a new Backend session asks about job, experience, languages, hours and goal.

### 3. Task card → full-screen workspace (≈3–4 h, sync point 02:00)
- The mentor turn will carry `task: TaskCard`. Render it as a card in the chat with an **Open** button (instead of the inline `CodeTask`).
- **Open** fetches `GET /api/tasks/:id` → `PublicTask` and expands a full-screen `WorkspaceShell`: ticket on the left, tool in the middle, the same chat on the right (collapsible). Esc / a button returns to the chat.
- Code workspace (`components/workspace/code/`): VS Code look — file tree, tabs, CodeMirror (already in the repo), terminal panel. **Run** = `runCode()` from `src/lib/runner.ts` with `visibleTests`. **Submit** = `POST /api/tasks/:id/submit` with `files` → show `GradeResult`: each check with a "code" or "model" badge, the explanation, and the `next` task card.
**Done when** Backend: interview → card → Open → edit → Run (red) → fix → Run (green) → Submit → verdict → next card, end to end.

### 4. Flicky in the browser (≈3 h, sync point 08:30)
Port the UI from [pango07/flicky](https://github.com/pango07/flicky) `src/renderer/components/`: `OverlayApp.tsx`, `CursorIcon.tsx`, `Waveform.tsx`, `StreamApp.tsx`, and `src/renderer/audio-capture-worklet.js` → `public/flicky/`. Keep the MIT header and add each file to `third_party/flicky/README.md`. The overlay becomes a `position: fixed` layer over the page.

Write `src/lib/flicky/bridge.ts` and install it as `window.flicky`. The ported components use these methods:

| Method | Web behaviour |
|---|---|
| `platform` | `"web"` (use Ctrl on all platforms; show ⌘ hints on Mac if you like) |
| `getDisplayInfo`, `onDisplayInfo` | the viewport: `{ id: 0, bounds: {x:0,y:0,width:innerWidth,height:innerHeight}, scaleFactor: devicePixelRatio }`, update on resize |
| `onStartCapture`, `onStopCapture` | fired by hold-to-talk: keydown/keyup of **Ctrl+Alt+X** in the tab (ignore auto-repeat) |
| `sendAudioChunk`, `reportMicLevel`, `reportMicError` | collect the recording; on stop, send it to `POST /api/flicky/transcribe` |
| `onVoiceStateChanged` | `idle → listening → processing → responding → idle` |
| `onTranscriptUpdate` | the transcribed question |
| `onAiResponseChunk`, `onAiResponseComplete` | from the `/api/flicky/ask` SSE stream (`chunk`, `done`); hide partial tags while streaming |
| `onWalkthrough`, `onWalkthroughStep` | from `done.walkthrough`; step targets are anchors (read the element's live rect) or snapshot pixels (`pointToViewport`) |
| `onCursorPosition` | track `mousemove` on the page |
| `onPlayAudio` | play `audio/wav` from `POST /api/flicky/speak`; if it fails or takes > 3 s, `speechSynthesis` |
| `onTypeFulfilled` | `[TYPE:…]`: insert into our own focused field; ignore in code tasks |
| `getChatHistory`, `onChatEntryAdded`, `onAiError` | the session's Flicky Q&A |

Anchors (`src/lib/flicky/anchors.ts`): a `useAnchor(id, label, role)` hook that registers an element. Ids are lowercase dotted paths without colons — see ARCHITECTURE §8 (`code.run`, `code.lines.13-15`, `design.fill.type`, `board.card.<id>`, `report.field.status`…). Register every button, field, layer and line range the assistant might point at.

Snapshot (`src/lib/flicky/snapshot.ts`): JPEG of the workspace (html-to-image for DOM, `canvas.toDataURL` for the design canvas), longest side ≤ 1600 px; send it with `viewportWidth/Height` so pixel targets map back.

Walkthrough: in a task, a step waits until the learner clicks its target (or within ~24 px of a pixel target); for "where is X?" it advances on Flicky's timer (`dwellMs`). After each answer, `POST /api/events` with `type: "hint"` and the number of steps shown.
**Done when** in the IDE: hold Ctrl+Alt+X → "how do I check the payment already exists?" → the cursor flies to the lines, the voice speaks, the next step waits for the click.

### 5. Design workspace (≈2 h)
`components/workspace/design/` on Fabric.js: select, rectangle, text, fill (solid / linear gradient with two stops), corner radius, layers panel, properties panel. Load `PublicTask.design.scene`, submit the current scene as `DesignScene`. Anchors for layers (`design.layer.<id>`), tools and property fields.
**Done when** the pay-button task can be solved and submitted, and Flicky can walk through "how do I make a gradient?".

### 6. Sprint board + report (≈1.5 h)
`components/workspace/board/`: backlog and sprint columns, capacity counter (`board.capacity`), move cards with buttons (drag-and-drop only if time allows), report form (status, risks, ask). Submit `board` + `report`.
**Done when** the sprint-at-risk task can be re-planned, reported and submitted.

### 7. Polish (until freeze at 10:30)
Loading and error states, mobile fallback (the workspace may say "best on a laptop"), keyboard focus, no layout jumps.

## Rules

- This Next.js version has breaking changes: read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code (see `AGENTS.md`).
- Branches `alsheri/<feature>`, PR into `main` every 2–3 hours, rebase on `main` first. CI must be green.
- A new npm dependency (e.g. `fabric`, `html-to-image`) goes in its own commit straight to `main`; on a lockfile conflict take `main`'s lockfile and run `npm install`.
- The learner's code never goes to the server on Run; only Submit sends it.
- UI copy is English (US users). Plain, short, active voice.
- Sync points (Astana): 22:30 contracts · 23:30 stubs · 02:00 workspace opens a real task · 05:30 Submit verdict · 08:30 Flicky · 10:30 freeze.
