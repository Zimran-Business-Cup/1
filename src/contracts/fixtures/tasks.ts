import type { GradeResult, PublicTask } from "../task";

// Sample data for the API stubs and for building the UI before the server is
// ready. Each object is a valid instance of its contract (checked at compile
// time with `satisfies`). Hidden tests and reference solutions are not here:
// they never reach the browser.

export const doublePayTask = {
  card: {
    id: "backend-double-pay-1",
    role: "backend-engineer",
    title: "Double payment",
    summary: "A customer tapped Pay twice and got charged twice. Make retries safe.",
    workspace: "code",
    language: "python",
    minutes: 20,
  },
  ticket: {
    from: "Maria, payments team lead",
    body: "A customer tapped **Pay** twice and we charged them twice. Fix the handler so a retry with the same key doesn't create a second payment.",
    requirements: [
      "The key comes in the `Idempotency-Key` header",
      "A retry returns the first payment",
      "Don't change the payments table",
    ],
  },
  code: {
    entry: "handler.py",
    files: [
      {
        path: "handler.py",
        readonly: false,
        content: `payments = []  # in-memory "payments" table


def create_payment(order_id, amount, key):
    payment = {"id": len(payments) + 1, "order_id": order_id, "amount": amount, "key": key}
    payments.append(payment)
    return payment


def handle_pay(request):
    key = request["headers"]["Idempotency-Key"]
    body = request["body"]
    # TODO: a retry with the same key must not charge twice
    payment = create_payment(body["order_id"], body["amount"], key)
    return 201, payment
`,
      },
    ],
    visibleTests: `req = {"headers": {"Idempotency-Key": "k-1"}, "body": {"order_id": "A-7", "amount": 48}}
status, first = handle_pay(req)
assert status == 201, "the first request should create a payment (201)"
status, second = handle_pay(req)
assert len(payments) == 1, f"expected 1 payment after a retry, found {len(payments)}"
assert second["id"] == first["id"], "a retry should return the first payment"
`,
  },
  design: null,
  board: null,
} satisfies PublicTask;

export const payButtonTask = {
  card: {
    id: "design-pay-button-1",
    role: "product-designer",
    title: "Pay button by the design system",
    summary: "Restyle the main button on the checkout screen to match the new design system.",
    workspace: "design",
    language: null,
    minutes: 15,
  },
  ticket: {
    from: "Anya, lead designer",
    body: "The main button on the checkout screen still uses the old style. Bring it in line with the new design system.",
    requirements: ["Fill: linear gradient", "Corner radius 12", "Text contrast at least 4.5:1"],
  },
  code: null,
  design: {
    scene: {
      width: 390,
      height: 420,
      nodes: [
        { id: "checkout", name: "Checkout", type: "frame", parentId: null, x: 0, y: 0, width: 390, height: 420, radius: 16, fill: { type: "solid", color: "#FFFFFF" }, text: null, textColor: null, fontSize: null },
        { id: "title", name: "Title", type: "text", parentId: "checkout", x: 24, y: 24, width: 342, height: 28, radius: 0, fill: null, text: "Checkout", textColor: "#121823", fontSize: 22 },
        { id: "total", name: "Total", type: "text", parentId: "checkout", x: 24, y: 300, width: 342, height: 24, radius: 0, fill: null, text: "Total  $48.00", textColor: "#121823", fontSize: 17 },
        { id: "pay-button", name: "Button / Pay", type: "rect", parentId: "checkout", x: 24, y: 344, width: 342, height: 48, radius: 6, fill: { type: "solid", color: "#2547D0" }, text: "Pay $48", textColor: "#FFFFFF", fontSize: 16 },
      ],
    },
  },
  board: null,
} satisfies PublicTask;

export const sprintAtRiskTask = {
  card: {
    id: "pm-sprint-at-risk-1",
    role: "project-manager",
    title: "Sprint at risk",
    summary: "The sprint is over capacity and a P0 bug is waiting. Re-plan it and report to the stakeholder.",
    workspace: "board",
    language: null,
    minutes: 20,
  },
  ticket: {
    from: "Oleg, head of product",
    body: "Customers are complaining about double charges. The fix has to make sprint 24. Send me a status update by 6 pm.",
    requirements: ["Team capacity: 30 story points", "Every P0 is in the sprint", "A status update for the stakeholder"],
  },
  code: null,
  design: null,
  board: {
    board: {
      sprintName: "Sprint 24",
      capacity: 30,
      cards: [
        { id: "fix-double-charge", title: "Fix double charges", priority: "P0", points: 5, column: "backlog", dependsOn: [] },
        { id: "csv-export", title: "Export to CSV", priority: "P2", points: 5, column: "backlog", dependsOn: [] },
        { id: "apple-pay", title: "Apple Pay checkout", priority: "P0", points: 8, column: "sprint", dependsOn: [] },
        { id: "push", title: "Push notifications", priority: "P1", points: 9, column: "sprint", dependsOn: [] },
        { id: "dark-mode", title: "Dark mode", priority: "P1", points: 8, column: "sprint", dependsOn: [] },
        { id: "onboarding-anim", title: "Onboarding animation", priority: "P2", points: 13, column: "sprint", dependsOn: [] },
      ],
    },
    report: { status: "", risks: "", ask: "" },
  },
} satisfies PublicTask;

export const FIXTURE_TASKS: PublicTask[] = [doublePayTask, payButtonTask, sprintAtRiskTask];

export const passedGrade = {
  taskId: "backend-double-pay-1",
  passed: true,
  checks: [
    { id: "creates", label: "The first request creates a payment", passed: true, by: "code", message: null },
    { id: "retry-one", label: "A retry with the same key keeps one payment", passed: true, by: "code", message: null },
    { id: "retry-same", label: "A retry returns the first payment", passed: true, by: "code", message: null },
    { id: "new-key", label: "A new key creates a new payment", passed: true, by: "code", message: null },
  ],
  explanation: "All hidden checks passed. You look up the payment by its key before creating one, which is exactly what idempotency means. Next: what if two requests with the same key arrive at the same moment?",
  next: {
    id: "backend-double-pay-2",
    role: "backend-engineer",
    title: "Concurrent retries",
    summary: "Two requests with the same key arrive at once. Only one payment may be created.",
    workspace: "code",
    language: "python",
    minutes: 20,
  },
} satisfies GradeResult;
