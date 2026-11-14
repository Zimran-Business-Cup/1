# src/server/ — owner: Anuar

Server-only code. Route handlers in `src/app/api/**` stay thin and call into here. Nothing in this folder may be imported from a client component.

| Folder | What it does |
|---|---|
| `db/` | Postgres client, migrations, queries (profiles, sessions, messages, tasks, attempts, guide_steps, ratings) |
| `tasks/` | pick a seed task by profile, ask the model to personalise it, self-check it in the runner, store it, return `PublicTask` |
| `grading/` | `Submission` → `GradeResult`: runner for code, rule checks for design scenes and boards, model explanation |
| `flicky/` | Flicky prompt (ported), `/ask` streaming, Groq Whisper and Kokoro clients, history compaction |
| `metrics/` | correctness, help used, progress, interest from events and grades |

API routes owned with this folder: `/api/tutor`, `/api/tasks/[id]`, `/api/tasks/[id]/submit`, `/api/flicky/{transcribe,ask,speak}`, `/api/events`. Contracts: `src/contracts`.
