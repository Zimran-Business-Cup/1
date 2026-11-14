# runner/ — owner: Anuar

A small internal service that runs learner code on the server, for two jobs:

1. **Hidden tests on Submit** — the verdict comes from here, not from the browser.
2. **Self-check of tasks** — the reference solution must pass the hidden tests and the starter code must fail them.

"Run" in the browser does not come here: it stays in the Pyodide / JS Web Worker (`src/lib/runner.ts`).

No dependencies beyond Node 22 and the Docker CLI, so it never touches the app's lockfile.

## API (internal: only the `app` container can reach it)

```
POST /run  { language: "python" | "javascript", files: [{path, content}], entry: string, tests: string }
        →  { ok, timedOut, ms, error, tests: [{name, label, passed, message}], stdout }
GET  /health → { ok, gvisor, active, queued }
```

Tests are `test_*` functions in Python (the first docstring line is the label the learner sees) or `test("label", fn)` calls in JavaScript, with `assert`. Every test runs against a fresh copy of the learner's code, so tests don't share state. Plain asserts without test functions count as one test.

## Sandbox

Each request gets a one-off container (`docker run --rm`):

| Limit | Value |
|---|---|
| network | none |
| filesystem | read-only root, `/tmp` in memory (64 MB) |
| user | 65534 (nobody), all capabilities dropped, `no-new-privileges` |
| CPU / memory / processes | 1 CPU, 256 MB (no swap), 64 processes |
| time / output | 10 s wall clock, 1 MB of output |
| runtime | gVisor (`runsc`) when the host has it, otherwise runc |
| parallel | 2 containers at a time, up to 20 waiting, then 503 |

The runner reaches the host Docker daemon through `/var/run/docker.sock`, which is root-equivalent on the host. That's why the service has no published ports and sits only on the internal compose network (no internet). It only ever runs `docker run` with fixed images and fixed flags; learner code is passed on stdin, never on a command line.

Checked locally (Colima, runc): uid 65534; no DNS or network (internet and `app:3000` unreachable); writing outside `/tmp` fails (read-only); no keys in the environment and no Docker socket inside the sandbox; a 600 MB allocation is stopped at 256 MB; a fork bomb hits the process limit; 3 MB on stdout is cut at 1 MB; an endless loop is stopped at 10 s; no sandbox containers are left behind.

Not a goal: stopping a learner who deliberately attacks the test harness to fake a pass. The sandbox protects the server, not the score.
