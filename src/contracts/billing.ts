import { z } from "zod";

// Pro subscription through Stripe Checkout (test mode).
//   POST /api/checkout          CheckoutRequest → CheckoutResponse (redirect the browser to `url`)
//                               503 { error, fallback: "demo" } when Stripe isn't configured:
//                               keep the old demo upgrade in that case.
//   GET  /api/checkout/status?session_id=cs_…   → CheckoutStatus
// Stripe sends the learner back to `returnPath` with
//   ?checkout=success&session_id=cs_…   or   ?checkout=cancel

export const PRICING = {
  currency: "usd",
  firstMonthCents: 2000,
  monthlyCents: 3500,
} as const;

export const CheckoutRequestSchema = z.object({
  returnPath: z
    .string()
    .max(300)
    .regex(/^\/(?!\/)\S*$/, "must be a path on this site, e.g. /s/backend-engineer")
    .describe("Where Stripe sends the learner back, usually location.pathname"),
});

export const CheckoutResponseSchema = z.object({ url: z.string().url() });

export const CheckoutStatusSchema = z.object({
  paid: z.boolean().describe("True once the first payment went through: unlock Pro"),
  status: z.enum(["open", "complete", "expired"]),
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;
export type CheckoutStatus = z.infer<typeof CheckoutStatusSchema>;
