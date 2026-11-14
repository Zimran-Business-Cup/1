# Flicky (third-party code)

The voice cursor assistant in heforage is a web port of [Flicky](https://github.com/pango07/flicky) by Julio Vaught and contributors, MIT License (see `LICENSE` here). Flicky itself is inspired by [Clicky](https://github.com/farzaa/clicky) by Farza.

Rules for anything copied from Flicky:

- Keep this header at the top of the copied file:
  ```
  // Adapted from Flicky (https://github.com/pango07/flicky), src/renderer/components/<File>.tsx
  // Copyright (c) 2026 Julio Vaught and Flicky contributors. MIT License, see third_party/flicky/LICENSE.
  ```
- Add the file to the table below.

| Our file | Flicky source | Changes |
|---|---|---|
| `src/contracts/flicky.ts` (tag parser) | `src/main/services/element-detector.ts` | anchor targets `[POINT:#id:label]`, unknown anchors dropped |
| `src/server/flicky/prompt.ts` | `src/main/services/prompts.ts` | workspace instead of desktop, anchors first, mentor rules, no `[TYPE]` for code |
| `src/server/flicky/ask.ts` (request shape) | `src/main/services/claude-api.ts` | official SDK with streaming, prompt caching and refusal fallback; anchors and task context in the user turn |
