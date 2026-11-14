# src/components/workspace/ — owner: Alsheri

The full-screen workspace that opens from a task card in the chat: task context on the left, the tool in the middle, the same chat on the right.

| Folder | Tool | Sends on Submit |
|---|---|---|
| `code/` | VS Code-like IDE: file tree, tabs, CodeMirror, terminal panel; Run uses `src/lib/runner.ts` | `files` |
| `design/` | Figma-like canvas on Fabric.js: layers, rect, text, fill (solid / linear), radius | `scene` (`DesignScene`) |
| `board/` | sprint board + status report form | `board` + `report` |

Every clickable target registers a Flicky anchor (`code.run`, `design.fill.type`, `board.card.<id>`, …) so the cursor assistant can point at it. Data shapes: `src/contracts/task.ts` and `src/contracts/workspace.ts`. Sample tasks: `src/contracts/fixtures/tasks.ts`.
