import type { Anchor } from "../flicky";

// A recorded Flicky answer for the stub of POST /api/flicky/ask, so the
// overlay can be built before the server calls the model. Run it through
// parseFlickyAnswer() to get the walkthrough.

export const designAnchors: Anchor[] = [
  { id: "design.layer.pay-button", label: "Button / Pay", role: "layer" },
  { id: "design.fill.type", label: "Fill type", role: "field" },
  { id: "design.fill.linear", label: "Linear gradient", role: "button" },
  { id: "design.radius", label: "Corner radius", role: "field" },
];

export const gradientAnswer =
  "Sure, three clicks. [POINT:#design.layer.pay-button:select the button] " +
  "[POINT:#design.fill.type:open the fill type] " +
  "[POINT:#design.fill.linear:pick linear gradient]";

export const codeAnchors: Anchor[] = [
  { id: "code.lines.13-15", label: "handle_pay body", role: "lines" },
  { id: "code.run", label: "Run tests", role: "button" },
  { id: "code.submit", label: "Submit", role: "button" },
];

export const doublePayAnswer =
  "The payment is created right away, before anything checks the key. " +
  "Look for an existing payment with this key first; if there is one, return it. " +
  "[POINT:#code.lines.13-15:the payment is created here] [POINT:#code.run:then run the tests]";
