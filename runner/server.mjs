// heforage runner: runs learner code for hidden tests and task self-checks.
// Every attempt gets a one-off container: no network, read-only root, /tmp in
// memory, non-root user, no capabilities, 1 CPU, 256 MB, 64 processes, 10 s.
// Internal service: only the app container can reach it (see docker-compose.yml).
import { spawn, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import http from "node:http";
import { RESULT_MARK, javascriptProgram, pythonProgram } from "./harness.mjs";

const PORT = Number(process.env.PORT ?? 8080);
const MAX_PARALLEL = Number(process.env.MAX_PARALLEL ?? 2);
const MAX_QUEUE = 20;
const TIMEOUT_MS = 10_000;
const MAX_OUTPUT = 1024 * 1024;
const MAX_BODY = 512 * 1024;

const LANGS = {
  python: { image: process.env.PYTHON_IMAGE ?? "python:3.12-slim", cmd: ["python3", "-I", "-"], program: pythonProgram },
  javascript: { image: process.env.NODE_IMAGE ?? "node:22-slim", cmd: ["node", "-"], program: javascriptProgram },
};

const run = (cmd, args) =>
  new Promise((resolve) => execFile(cmd, args, { timeout: 120_000 }, (err, stdout) => resolve(err ? null : stdout)));

// gVisor when the host has it; plain runc with the same limits otherwise.
let gvisor = false;
const ready = (async () => {
  const runtimes = await run("docker", ["info", "--format", "{{json .Runtimes}}"]);
  gvisor = Boolean(runtimes && runtimes.includes("runsc"));
  await Promise.all(Object.values(LANGS).map((l) => run("docker", ["pull", "-q", l.image])));
  console.log(`[runner] ready: gvisor=${gvisor}, images pulled`);
})();

// ---------- a tiny queue: at most MAX_PARALLEL containers at once ----------
let active = 0;
const waiting = [];
function acquire() {
  if (active < MAX_PARALLEL) {
    active++;
    return Promise.resolve();
  }
  if (waiting.length >= MAX_QUEUE) return null;
  return new Promise((resolve) => waiting.push(resolve));
}
function release() {
  const next = waiting.shift();
  if (next) next();
  else active--;
}

function sandbox(lang, program) {
  const name = `hf-run-${randomUUID()}`;
  const args = [
    "run", "--rm", "-i", "--name", name,
    "--network", "none",
    "--read-only", "--tmpfs", "/tmp:rw,size=64m,mode=1777",
    "--memory", "256m", "--memory-swap", "256m", "--cpus", "1", "--pids-limit", "64",
    "--user", "65534:65534", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
    "--workdir", "/tmp", "-e", "PYTHONDONTWRITEBYTECODE=1", "-e", "HOME=/tmp",
    ...(gvisor ? ["--runtime", "runsc"] : []),
    lang.image, ...lang.cmd,
  ];
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    let timedOut = false;
    let tooBig = false;
    const kill = () => execFile("docker", ["kill", name], () => {});
    const timer = setTimeout(() => {
      timedOut = true;
      kill();
    }, TIMEOUT_MS);
    child.stdout.on("data", (d) => {
      out += d;
      if (out.length > MAX_OUTPUT && !tooBig) {
        tooBig = true;
        kill();
      }
    });
    child.stderr.on("data", (d) => {
      if (err.length < 16_000) err += d;
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ out, err, code, timedOut, tooBig, ms: Date.now() - started });
    });
    child.stdin.end(program);
  });
}

function validate(body) {
  if (!body || typeof body !== "object") return "Body must be a JSON object.";
  if (!LANGS[body.language]) return "language must be python or javascript.";
  if (!Array.isArray(body.files) || !body.files.length) return "files must be a non-empty array.";
  for (const f of body.files) {
    if (typeof f?.path !== "string" || typeof f?.content !== "string") return "Each file needs path and content.";
    if (f.path.startsWith("/") || f.path.includes("..")) return `Bad file path: ${f.path}`;
  }
  const entry = body.entry ?? body.files[0].path;
  if (!body.files.some((f) => f.path === entry)) return "entry must be one of the files.";
  if (typeof body.tests !== "string") return "tests must be a string.";
  return null;
}

async function handleRun(body) {
  const problem = validate(body);
  if (problem) return [400, { error: problem }];
  await ready;
  const slot = acquire();
  if (!slot) return [503, { error: "The sandbox is busy. Try again in a few seconds." }];
  await slot;
  try {
    const lang = LANGS[body.language];
    const payload = { files: body.files, entry: body.entry ?? body.files[0].path, tests: body.tests };
    const r = await sandbox(lang, lang.program(payload));
    if (r.timedOut) return [200, { ok: false, timedOut: true, ms: r.ms, error: `Stopped after ${TIMEOUT_MS / 1000} seconds. Look for a loop that never ends.`, tests: [], stdout: "" }];
    if (r.tooBig) return [200, { ok: false, timedOut: false, ms: r.ms, error: "The program printed more than 1 MB.", tests: [], stdout: "" }];
    // The harness prints its result last; take the last marker in the output.
    const at = r.out.lastIndexOf(RESULT_MARK);
    if (at === -1) {
      const crash = r.code === 137 ? "The program used more than 256 MB of memory." : r.err.trim().split("\n").pop() || "The program crashed.";
      return [200, { ok: false, timedOut: false, ms: r.ms, error: crash, tests: [], stdout: r.out.slice(-8000) }];
    }
    const result = JSON.parse(r.out.slice(at + RESULT_MARK.length).split("\n")[0]);
    return [200, { ok: !result.error, timedOut: false, ms: r.ms, ...result }];
  } finally {
    release();
  }
}

const server = http.createServer((req, res) => {
  const send = (status, obj) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(obj));
  };
  if (req.method === "GET" && req.url === "/health") return send(200, { ok: true, gvisor, active, queued: waiting.length });
  if (req.method !== "POST" || req.url !== "/run") return send(404, { error: "Not found." });
  let size = 0;
  const chunks = [];
  req.on("data", (c) => {
    size += c.length;
    if (size > MAX_BODY) {
      send(413, { error: "The request is larger than 512 KB." });
      req.destroy();
    } else chunks.push(c);
  });
  req.on("end", async () => {
    if (res.writableEnded) return;
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      return send(400, { error: "Body must be JSON." });
    }
    try {
      const [status, obj] = await handleRun(body);
      send(status, obj);
    } catch (e) {
      console.error("[runner]", e);
      send(500, { error: "The sandbox failed." });
    }
  });
});

server.listen(PORT, () => console.log(`[runner] listening on ${PORT}, ${MAX_PARALLEL} at a time`));
