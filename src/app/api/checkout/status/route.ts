import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { StripeError, checkoutStatus, stripeKey } from "@/server/billing/stripe";
import { errorJson } from "@/server/http";

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

// GET /api/checkout/status?session_id=cs_…  → CheckoutStatus (src/contracts/billing.ts).
// The page calls it after Stripe redirects back, and unlocks Pro when `paid`.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("session_id") ?? "";
  if (!SESSION_ID.test(id)) return errorJson(400, "Pass the Stripe session id as ?session_id=cs_…");
  if (!stripeKey()) return NextResponse.json({ error: "Stripe isn't configured on this server.", fallback: "demo" }, { status: 503 });

  try {
    return NextResponse.json(await checkoutStatus(id));
  } catch (error) {
    if (error instanceof StripeError) return errorJson(error.status === 404 ? 404 : 502, error.message);
    throw error;
  }
}
