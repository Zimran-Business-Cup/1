import { PRICING, type CheckoutStatus } from "@/contracts/billing";

const API = "https://api.stripe.com/v1";
const COUPON_ID = "heforage-first-month-20";

export class StripeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// Test keys only unless STRIPE_ALLOW_LIVE=1, so a misplaced live key can't charge real cards.
export function stripeKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (key.startsWith("sk_test_") || key.startsWith("rk_test_")) return key;
  return process.env.STRIPE_ALLOW_LIVE === "1" ? key : null;
}

type Params = { [key: string]: string | number | boolean | Params | Params[] | undefined };

/** Stripe's form encoding: nested objects and arrays become a[b][0][c]=v. */
export function formEncode(params: Params, prefix = "", out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => formEncode(item, `${key}[${i}]`, out));
    else if (typeof v === "object") formEncode(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function call<T>(method: "GET" | "POST", path: string, params?: Params): Promise<T> {
  const key = stripeKey();
  if (!key) throw new StripeError("Stripe isn't configured.", 503);
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "POST" && params ? formEncode(params) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } } & T;
  if (!res.ok) throw new StripeError(data.error?.message ?? `Stripe answered ${res.status}.`, res.status);
  return data;
}

/** $20 first month: a one-time $15 coupon on the $35 price, created on first use. */
async function ensureCoupon(): Promise<string> {
  try {
    await call("GET", `/coupons/${COUPON_ID}`);
  } catch (error) {
    if (!(error instanceof StripeError) || error.status !== 404) throw error;
    await call("POST", "/coupons", {
      id: COUPON_ID,
      name: "First month $20",
      amount_off: PRICING.monthlyCents - PRICING.firstMonthCents,
      currency: PRICING.currency,
      duration: "once",
    });
  }
  return COUPON_ID;
}

export async function createCheckout(origin: string, returnPath: string): Promise<string> {
  const back = (query: string) => `${origin}${returnPath}${returnPath.includes("?") ? "&" : "?"}${query}`;
  const session = await call<{ url: string }>("POST", "/checkout/sessions", {
    mode: "subscription",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: PRICING.currency,
          unit_amount: PRICING.monthlyCents,
          recurring: { interval: "month" },
          product_data: { name: "heforage Pro", description: "Every task in every role, your practice plan and portfolio review." },
        },
      },
    ],
    discounts: [{ coupon: await ensureCoupon() }],
    // Stripe fills in {CHECKOUT_SESSION_ID}; the page checks it with /api/checkout/status.
    success_url: back("checkout=success&session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: back("checkout=cancel"),
    metadata: { product: "heforage-pro" },
  });
  return session.url;
}

export async function checkoutStatus(sessionId: string): Promise<CheckoutStatus> {
  const s = await call<{ status: CheckoutStatus["status"]; payment_status: string }>("GET", `/checkout/sessions/${sessionId}`);
  return { status: s.status, paid: s.status === "complete" && s.payment_status !== "unpaid" };
}
