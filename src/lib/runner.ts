"use client";

// Runs learner code in the browser, inside Web Workers, so nothing touches
// the server: Python through Pyodide, JavaScript through an isolated worker.
// A run that takes longer than TIMEOUT_MS is stopped and the worker replaced.

export type Language = "python" | "javascript";

export interface RunResult {
  ok: boolean;
  output: string;
  error?: string;
  tests?: { passed: boolean; error?: string } | null;
}

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js";
const TIMEOUT_MS = 10_000;

const PYTHON_WORKER = `
importScripts(${JSON.stringify(PYODIDE_URL)});
const ready = loadPyodide();
const lastLine = (msg) => {
  const lines = String(msg).trim().split("\\n").filter(Boolean);
  return lines[lines.length - 1] || String(msg);
};
self.onmessage = async (event) => {
  const { id, code, tests } = event.data;
  let output = "";
  try {
    const py = await ready;
    py.setStdout({ batched: (s) => { output += s + "\\n"; } });
    py.setStderr({ batched: (s) => { output += s + "\\n"; } });
    const ns = py.globals.get("dict")();
    try {
      await py.runPythonAsync(code, { globals: ns });
    } catch (err) {
      self.postMessage({ id, ok: false, output, error: lastLine(err.message) });
      return;
    }
    let testResult = null;
    if (tests) {
      const saved = output;
      try {
        await py.runPythonAsync(tests, { globals: ns });
        testResult = { passed: true };
      } catch (err) {
        testResult = { passed: false, error: lastLine(err.message).replace(/^AssertionError:?\\s*/, "") || "a check failed" };
      }
      output = saved;
    }
    self.postMessage({ id, ok: true, output, tests: testResult });
  } catch (err) {
    self.postMessage({ id, ok: false, output, error: "Python failed to load: " + lastLine(err.message) });
  }
};
`;

// Learner code runs in its own worker: no DOM, no page storage, and the
// network APIs are removed before any code runs.
const JS_WORKER = `
for (const name of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "importScripts", "indexedDB", "caches"]) {
  try { Object.defineProperty(self, name, { value: undefined, configurable: false }); } catch {}
}
const show = (v) => (typeof v === "string" ? v : (() => { try { return JSON.stringify(v); } catch { return String(v); } })());
class AssertionError extends Error {}
const assert = (cond, msg) => { if (!cond) throw new AssertionError(msg || "a check failed"); };
self.onmessage = (event) => {
  const { id, code, tests } = event.data;
  const logs = [];
  const consoleShim = {
    log: (...a) => logs.push(a.map(show).join(" ")),
    error: (...a) => logs.push(a.map(show).join(" ")),
    warn: (...a) => logs.push(a.map(show).join(" ")),
  };
  const quiet = { log() {}, error() {}, warn() {} };
  try {
    new Function("console", "assert", code)(consoleShim, assert);
  } catch (err) {
    self.postMessage({ id, ok: false, output: logs.join("\\n"), error: String(err && err.message ? err.name + ": " + err.message : err) });
    return;
  }
  let testResult = null;
  if (tests) {
    try {
      new Function("console", "assert", code + "\\n" + tests)(quiet, assert);
      testResult = { passed: true };
    } catch (err) {
      testResult = { passed: false, error: err && err.message ? err.message : String(err) };
    }
  }
  self.postMessage({ id, ok: true, output: logs.join("\\n"), tests: testResult });
};
`;

const workers: Partial<Record<Language, Worker>> = {};
let nextId = 1;

function workerFor(lang: Language): Worker {
  if (!workers[lang]) {
    const src = lang === "python" ? PYTHON_WORKER : JS_WORKER;
    const url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
    workers[lang] = new Worker(url);
  }
  return workers[lang]!;
}

/** Start loading Pyodide early so the first run is fast. */
export function warmUp(lang: Language) {
  workerFor(lang);
}

export function runCode(lang: Language, code: string, tests: string): Promise<RunResult> {
  const worker = workerFor(lang);
  const id = nextId++;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      worker.terminate();
      delete workers[lang];
      resolve({ ok: false, output: "", error: `Stopped after ${TIMEOUT_MS / 1000} seconds. Check for a loop that never ends.` });
    }, lang === "python" ? TIMEOUT_MS * 3 : TIMEOUT_MS);
    const onMessage = (event: MessageEvent) => {
      if (event.data?.id !== id) return;
      clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      resolve(event.data as RunResult);
    };
    worker.addEventListener("message", onMessage);
    worker.postMessage({ id, code, tests });
  });
}
