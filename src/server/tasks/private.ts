// Server-only: hidden tests and reference solutions. Never send these to the browser.

import { LADDER_PRIVATE } from "./ladder-private";

export interface PrivateTask {
  /** test_* functions; the first docstring line is the check label. */
  hiddenTests: string;
  /** Passes every hidden test. */
  solution: { path: string; content: string }[];
}

const DOUBLE_PAY_TESTS = `
def _req(key, order="A-7", amount=48):
    return {"headers": {"Idempotency-Key": key}, "body": {"order_id": order, "amount": amount}}


def test_creates_payment():
    """The first request creates a payment"""
    status, payment = handle_pay(_req("k-1"))
    assert status == 201, f"the first request should answer 201, got {status}"
    assert len(payments) == 1, f"expected 1 payment, found {len(payments)}"
    assert payment["amount"] == 48, "the payment should keep the amount"


def test_retry_keeps_one_payment():
    """A retry with the same key keeps one payment"""
    handle_pay(_req("k-1"))
    handle_pay(_req("k-1"))
    assert len(payments) == 1, f"expected 1 payment after a retry, found {len(payments)}"


def test_retry_returns_first_payment():
    """A retry returns the first payment"""
    _, first = handle_pay(_req("k-1"))
    _, second = handle_pay(_req("k-1"))
    assert second["id"] == first["id"], "a retry should return the first payment, not a new one"


def test_new_key_new_payment():
    """A new key creates a new payment"""
    handle_pay(_req("k-1"))
    handle_pay(_req("k-2", order="A-8"))
    assert len(payments) == 2, f"two different keys should give 2 payments, found {len(payments)}"
`;

const DOUBLE_PAY_SOLUTION = `payments = []  # in-memory "payments" table


def create_payment(order_id, amount, key):
    payment = {"id": len(payments) + 1, "order_id": order_id, "amount": amount, "key": key}
    payments.append(payment)
    return payment


def handle_pay(request):
    key = request["headers"]["Idempotency-Key"]
    body = request["body"]
    existing = next((p for p in payments if p["key"] == key), None)
    if existing:
        return 200, existing
    payment = create_payment(body["order_id"], body["amount"], key)
    return 201, payment
`;

const PRIVATE: Record<string, PrivateTask> = {
  "backend-double-pay-1": {
    hiddenTests: DOUBLE_PAY_TESTS,
    solution: [{ path: "handler.py", content: DOUBLE_PAY_SOLUTION }],
  },
};

export function privateTask(id: string): PrivateTask | null {
  return PRIVATE[id] ?? LADDER_PRIVATE[id] ?? null;
}
