# src/components/flicky/ — owner: Alsheri

The Flicky UI ported from Electron to the browser. Copy these from [pango07/flicky](https://github.com/pango07/flicky) `src/renderer/components/` and keep the MIT header (see `third_party/flicky/README.md`):

| Flicky file | Here | Change |
|---|---|---|
| `OverlayApp.tsx` | `FlickyOverlay.tsx` | a `position: fixed` layer over the page instead of a transparent window; targets come from anchors or snapshot pixels |
| `CursorIcon.tsx` | `CursorIcon.tsx` | none |
| `Waveform.tsx` | `Waveform.tsx` | none |
| `StreamApp.tsx` | `FlickyStream.tsx` | floating panel or the right-hand chat panel |

These components only talk to `window.flicky`. In the web app that object is the bridge in `src/lib/flicky/`.
