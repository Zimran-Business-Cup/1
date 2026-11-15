// Programs run inside the sandbox. Each runs every test against a fresh copy of
// the learner's code and prints RESULT_MARK followed by a JSON result.

export const RESULT_MARK = "__RUNNER_RESULT__";

const b64 = (payload) => Buffer.from(JSON.stringify(payload)).toString("base64");

export function pythonProgram(payload) {
  return `
import base64, contextlib, io, json, os, sys
P = json.loads(base64.b64decode("${b64(payload)}").decode())
REAL = sys.stdout
W = "/tmp/w"
os.makedirs(W, exist_ok=True)
for f in P["files"]:
    path = os.path.join(W, f["path"])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write(f["content"])
sys.path.insert(0, W)
entry = next(f for f in P["files"] if f["path"] == P["entry"])

def describe(e):
    msg = str(e)
    if isinstance(e, AssertionError):
        return msg or "a check failed"
    return f"{type(e).__name__}: {msg}" if msg else type(e).__name__

# Tests can read what the learner's program printed (__output__) and its code (__source__).
def fresh():
    ns = {"__name__": "__main__", "__file__": os.path.join(W, P["entry"]), "__source__": entry["content"]}
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(entry["content"], P["entry"], "exec"), ns)
    finally:
        sys.stdout.write(buf.getvalue())
    ns["__output__"] = buf.getvalue()
    return ns

out = io.StringIO()
result = {"error": None, "tests": []}
with contextlib.redirect_stdout(out), contextlib.redirect_stderr(out):
    try:
        ns = fresh()
    except BaseException as e:
        result["error"] = describe(e)
    if result["error"] is None:
        try:
            exec(compile(P["tests"], "tests.py", "exec"), ns)
            names = [k for k, v in ns.items() if k.startswith("test_") and callable(v)]
            if not names:
                result["tests"].append({"name": "tests", "label": "tests", "passed": True, "message": None})
        except BaseException as e:
            names = []
            result["tests"].append({"name": "tests", "label": "tests", "passed": False, "message": describe(e)})
        for name in names:
            label = ((ns[name].__doc__ or "").strip().splitlines() or [name])[0]
            try:
                t = fresh()
                exec(compile(P["tests"], "tests.py", "exec"), t)
                t[name]()
                result["tests"].append({"name": name, "label": label, "passed": True, "message": None})
            except BaseException as e:
                result["tests"].append({"name": name, "label": label, "passed": False, "message": describe(e)})
result["stdout"] = out.getvalue()[-8000:]
REAL.write("\\n${RESULT_MARK}" + json.dumps(result) + "\\n")
`;
}

export function javascriptProgram(payload) {
  return `
const vm = require("vm");
const P = JSON.parse(Buffer.from("${b64(payload)}", "base64").toString());
const entry = P.files.find((f) => f.path === P.entry);
const logs = [];
const show = (v) => (typeof v === "string" ? v : (() => { try { return JSON.stringify(v); } catch { return String(v); } })());
class AssertionError extends Error {}
const assert = (cond, msg) => { if (!cond) throw new AssertionError(msg || "a check failed"); };
const describe = (e) => (e instanceof AssertionError ? e.message : e && e.message ? e.name + ": " + e.message : String(e));
// Tests can read what the learner's program printed (__output__) and its code (__source__).
function fresh() {
  const registered = [];
  const own = [];
  const say = (...a) => { const line = a.map(show).join(" "); logs.push(line); own.push(line); };
  const ctx = vm.createContext({ console: { log: say, error: say, warn: say }, assert, test: (name, fn) => registered.push({ name, fn }), __source__: entry.content });
  vm.runInContext(entry.content, ctx, { filename: P.entry, timeout: 8000 });
  ctx.__output__ = own.join("\\n");
  return { ctx, registered };
}
const result = { error: null, tests: [] };
let names = [];
try {
  const { ctx, registered } = fresh();
  try {
    vm.runInContext(P.tests, ctx, { filename: "tests.js", timeout: 8000 });
    names = registered.map((t) => t.name);
    if (!names.length) result.tests.push({ name: "tests", label: "tests", passed: true, message: null });
  } catch (e) {
    result.tests.push({ name: "tests", label: "tests", passed: false, message: describe(e) });
  }
} catch (e) {
  result.error = describe(e);
}
names.forEach((name, i) => {
  try {
    const { ctx, registered } = fresh();
    vm.runInContext(P.tests, ctx, { filename: "tests.js", timeout: 8000 });
    const r = registered[i].fn();
    if (r && typeof r.then === "function") throw new Error("async tests aren't supported");
    result.tests.push({ name, label: name, passed: true, message: null });
  } catch (e) {
    result.tests.push({ name, label: name, passed: false, message: describe(e) });
  }
});
result.stdout = logs.join("\\n").slice(-8000);
process.stdout.write("\\n${RESULT_MARK}" + JSON.stringify(result) + "\\n");
`;
}
