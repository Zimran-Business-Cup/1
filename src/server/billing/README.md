# src/server/billing/ — owner: Anuar

Pro subscription through **Stripe Checkout in test mode**. Contract: `src/contracts/billing.ts`.

- `POST /api/checkout { returnPath }` creates a Checkout Session: $35/month subscription with a one-time $15 coupon, so the first month is $20 (matches the paywall). Returns `{ url }`; the browser goes there.
- Stripe sends the learner back to `returnPath?checkout=success&session_id=cs_…` (or `?checkout=cancel`).
- `GET /api/checkout/status?session_id=cs_…` asks Stripe and returns `{ paid, status }`. The page unlocks Pro when `paid` is true.
- Without `STRIPE_SECRET_KEY` both routes answer **503 `{ fallback: "demo" }`** and the UI keeps the demo upgrade, so the app works with or without Stripe.

Config (server env only): `STRIPE_SECRET_KEY=sk_test_…`; `PUBLIC_URL` in production so the return links use the real domain. Live keys are refused unless `STRIPE_ALLOW_LIVE=1`.

No SDK: `stripe.ts` calls the REST API with `fetch` and Stripe's form encoding. Test card for the jury: `4242 4242 4242 4242`, any future date, any CVC.

Not yet: webhooks and storing Pro on the server (it lives in the browser's session store for now); that comes with Postgres.
