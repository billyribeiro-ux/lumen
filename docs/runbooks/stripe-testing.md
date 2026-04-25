# Runbook — Stripe Testing

> **Owner:** Billing layer (Phase 8 + 9 + 10).
> **Audience:** Anyone working on subscription, invoice, or payment-method
> code paths.
> **Rule of thumb:** Use the Stripe CLI for everything; never click in the
> dashboard outside investigation.

---

## Prerequisites

```bash
brew install stripe/stripe-cli/stripe
stripe login   # authenticates against your test mode account
```

Set in `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # printed by `stripe listen` below
```

---

## Local development loop

```bash
# 1. Start the dev server
pnpm dev

# 2. Forward Stripe webhooks to local
pnpm stripe:listen

# Copy the printed `whsec_...` into .env as STRIPE_WEBHOOK_SECRET, restart dev.

# 3. Seed the catalog into Stripe (DB → Stripe)
pnpm stripe:sync

# 4. Seed test customers (creates active subscriptions for two seed personas)
pnpm stripe:seed-customers
```

After step 4 the seeded webhooks will fire against your local dev server,
populating `subscriptions`, `invoices`, `payment_methods`, and `entitlements`
through the Phase 9 dispatch table. Verify with `pnpm db:studio`.

---

## Test cards

Standard Stripe test cards (full list:
[stripe.com/docs/testing](https://stripe.com/docs/testing)):

| Brand | Number | Outcome |
|---|---|---|
| Visa | `4242 4242 4242 4242` | Success |
| Visa (debit) | `4000 0566 5566 5556` | Success |
| Mastercard | `5555 5555 5555 4444` | Success |
| 3DS required | `4000 0027 6000 3184` | Triggers 3-D Secure |
| Declined | `4000 0000 0000 0002` | Generic decline |
| Insufficient funds | `4000 0000 0000 9995` | Decline reason |
| Expired card | `4000 0000 0000 0069` | `expired_card` |

Any future expiration, any 3-digit CVC, any postal code.

The seed-customer script attaches `pm_card_visa` (Stripe's
predefined test PaymentMethod) so subscriptions transition straight
to `active` without a card collection step.

---

## Triggering webhook events

Trigger any event by name with `stripe trigger`:

```bash
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger payment_method.attached
```

The receiver at `/api/webhooks/stripe` records every event in
`webhook_events`. Re-triggering is idempotent — the second arrival
short-circuits to a 200 reply with no side effects.

---

## Replay a stored webhook

When debugging a Phase 9 handler regression, replay an event from
the `webhook_events` table:

```bash
# Find the event id in the dashboard or db
psql $DATABASE_URL -c "SELECT id, provider_event_id, event_type FROM webhook_events ORDER BY created_at DESC LIMIT 5"

# Resend it to your local listener
stripe events resend evt_1ABC...
```

Resending a previously-processed event will idempotency-replay (200 reply,
no DB changes). To force a re-run for testing, mark the row as `received`:

```sql
UPDATE webhook_events SET status = 'received', processed_at = null WHERE provider_event_id = 'evt_1ABC...';
```

---

## Inspecting the seeded subscriptions

```bash
stripe customers list --email billy@lumen.so
stripe subscriptions list --customer cus_...
stripe invoices list --customer cus_...
```

Or via Drizzle Studio:

```bash
pnpm db:studio
# open http://localhost:4983
```

---

## Cleaning up between test runs

The Stripe test account accumulates customers + subscriptions across
runs. To wipe everything:

```bash
# In test mode only — never run against live.
stripe customers list --limit 100 \
  | jq -r '.data[].id' \
  | xargs -I{} stripe customers delete {}
```

The local DB can be wiped with:

```bash
ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:reset
```

The two are independent — wiping the DB without wiping Stripe leaves
orphan customers; wiping Stripe without wiping the DB leaves orphan
`subscriptions.stripe_subscription_id`s.

---

## Production rollover

When promoting from test to live:

1. `stripe login` against the live account.
2. `STRIPE_SECRET_KEY=sk_live_... pnpm stripe:sync` — creates live
   products + prices using the same lookup keys. Drizzle backfills
   the `stripe_*_id` columns.
3. Update Vercel env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `PUBLIC_STRIPE_PUBLISHABLE_KEY`.
4. Configure the production webhook endpoint at
   `https://lumen.so/api/webhooks/stripe` in the Stripe dashboard.
   Subscribe to the same events the local listener forwards.
5. Smoke test with a real card. Never `pnpm stripe:seed-customers`
   against a live key (the script refuses anyway).

---

## Related

- ADR-006 — Dynamic pricing from the database.
- `src/lib/server/stripe/` — client + webhook + audit.
- `src/lib/server/billing/handlers.ts` — subscription/invoice/pm dispatch.
- `scripts/stripe/sync.ts` — DB → Stripe catalog sync.
- `scripts/stripe/seed-customers.ts` — test customer + subscription seed.
