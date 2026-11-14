import { NextResponse } from "next/server";
import { CheckoutRequestSchema, type CheckoutResponse } from "@/contracts/billing";
import { allow } from "@/lib/rate-limit";
import { StripeError, createCheckout, stripeKey } from "@/server/billing/stripe";
import { clientIp, errorJson, readJson } from "@/server/http";

// POST /api/checkout  CheckoutRequest → CheckoutResponse (src/contracts/billing.ts).
// Without a Stripe test key it answers 503 with fallback "demo", and the UI
// keeps its demo upgrade.
export async function POST(request: Request) {
  if (!allow(`checkout:${clientIp(request)}`)) return errorJson(429, "Too many checkout attempts. Wait a minute.");
  const body = await readJson(request, CheckoutRequestSchema);
  if (!body.ok) return body.response;
  if (!stripeKey()) return NextResponse.json({ error: "Stripe isn't configured on this server.", fallback: "demo" }, { status: 503 });

  try {
    const url = await createCheckout(siteOrigin(request), body.data.returnPath);
    const result: CheckoutResponse = { url };
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StripeError) return errorJson(502, `Checkout failed: ${error.message}`);
    throw error;
  }
}

/** The public origin Stripe sends the learner back to. PUBLIC_URL wins in production. */
function siteOrigin(request: Request): string {
  const configured = process.env.PUBLIC_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}
