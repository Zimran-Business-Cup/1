# runner

Internal service that runs learner code on the server: hidden tests on Submit, and checks that a task's reference solution passes. Only the `app` container can reach it.

```
POST /run    { language: "python" | "javascript", files: [{path, content}], entry, tests }
          →  { ok, timedOut, ms, error, tests: [{name, label, passed, message}], stdout }
GET  /health → { ok, gvisor, active, queued }
```

Python tests are `test_*` functions; the first line of the docstring is the label shown to the learner. JavaScript tests are `test("label", fn)` calls. Each test runs against a fresh copy of the learner's code.

Every request starts a container with `docker run --rm`: no network, read-only root, 64 MB `/tmp`, user 65534, no capabilities, 1 CPU, 256 MB, 64 processes, 10 s, 1 MB of output, and gVisor when the host provides `runsc`. Two run at a time.

The service mounts `/var/run/docker.sock`, which is root-equivalent on the host. It has no published ports and no internet access, and it only runs fixed images with fixed flags; learner code is passed on stdin.

Tested locally: the sandbox has no DNS or network, cannot write outside `/tmp`, sees no environment secrets or Docker socket, stops a 600 MB allocation, a fork bomb and an endless loop, and truncates 3 MB of output.
