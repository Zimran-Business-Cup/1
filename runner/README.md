# runner/ — owner: Anuar

A small internal service that runs learner code on the server, for two jobs only:

1. **Hidden tests on Submit** — the verdict comes from here, not from the browser.
2. **Self-check of generated tasks** — the reference solution must pass the new tests and the starter code must fail them, otherwise the task is thrown away.

"Run" in the browser does not come here: it stays in the Pyodide / JS Web Worker (`src/lib/runner.ts`).

It has its own `package.json`, so its dependencies never conflict with the app's lockfile.

Internal API (only the `app` container can reach it):

```
POST /run  { language: "python" | "javascript", files: [{path, content}], tests: string }
        →  { ok, stdout, stderr, tests: { passed, failures: [{name, message}] }, timedOut, ms }
```

Sandbox per attempt: one-off container, no network, non-root, read-only root, `/tmp` in memory, 1 CPU, 256 MB, 64 processes, 10 s, output ≤ 1 MB, gVisor (`runsc`) when the host supports it. At most two containers at a time.
