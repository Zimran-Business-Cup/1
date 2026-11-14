# Flicky

Parts of the voice assistant are adapted from [Flicky](https://github.com/pango07/flicky) by Julio Vaught and contributors, MIT License (see `LICENSE`). Flicky is itself inspired by [Clicky](https://github.com/farzaa/clicky) by Farza.

| File | Flicky source | Changes |
|---|---|---|
| `src/contracts/flicky.ts` (tag parser) | `src/main/services/element-detector.ts` | anchor targets, unknown anchors dropped |
| `src/server/flicky/prompt.ts` | `src/main/services/prompts.ts` | workspace instead of desktop, anchors first, mentor rules |
| `src/server/flicky/ask.ts` | `src/main/services/claude-api.ts` | official SDK, prompt caching, anchors and task in the user turn |
