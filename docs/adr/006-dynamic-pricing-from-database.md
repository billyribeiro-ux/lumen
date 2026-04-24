# ADR-006: Dynamic pricing from the database, not the Stripe dashboard

**Status:** Accepted
**Date:** 2026-04-24
**Deciders:** @billyribeiro-ux
**Phase:** 0 — Foundation
**Tags:** `billing`, `stripe`, `architecture`, `foundation`

---

## Context

Lumen sells three tiers — Free ($0), Pro ($20/mo), Studio ($40/mo) — via Stripe (per `LUMEN_VISION.md` Pricing & Tiers and `ARCHITECTURE.md` §7). Every SaaS that bills through Stripe faces an architectural fork early:

- **Path A (Stripe-as-source-of-truth):** Products and prices are created in the Stripe dashboard. The application reads them via the Stripe API. The pricing page is rendered from a Stripe `prices.list()` response. Migrations between environments mean re-creating products and prices in each Stripe account.
- **Path B (DB-as-source-of-truth, also called "dynamic pricing from DB"):** Products and prices are defined in the application database. A seeding script mirrors them into Stripe. The pricing page is rendered from Postgres. Stripe is invoked only when a user actually checks out, paying or managing a subscription.

The choice constrains the next decade of billing decisions. Reversing it after launch — once paying customers exist in Stripe with various coupons, proration states, and plan histories — is expensive and error-prone.

Lumen's billing requirements:

- **Pricing page is a hot path.** It must be server-rendered with sub-100ms TTFB. A Stripe API call on every page render is unacceptable.
- **Three environments** (production, staging, dev / preview) need their own Stripe accounts (test mode for non-production). Each must have a consistent set of products and prices without manual dashboard work.
- **Per-PR Neon branches** (ADR-002) mean any developer or CI run can need a fully-stocked billing environment at zero notice. Re-creating Stripe products from scratch per environment is operationally untenable.
- **Entitlements are tier-derived.** `entitlements` rows are computed from a user's subscription, which references a `prices` row, which references a `products` row. Without DB rows for products and prices, entitlements cannot exist at the right granularity.
- **Audit and compliance.** Pricing changes must be reviewable. Git history of `products.ts` / `prices.ts` seed files is auditable; Stripe dashboard click history is not.

---

## Decision

**The Lumen Postgres database is the canonical source of truth for products and prices. Stripe is a payment processor, not a pricing source.**

Concretely:

- `products` and `prices` tables live in the application schema (`src/lib/server/db/schema/billing.ts`).
- `products` rows describe Lumen's tiers (`free`, `pro`, `studio`) with name, description, sort order, feature manifest, and entitlement metadata.
- `prices` rows describe the price points (monthly / annual per tier) including currency, unit amount, and Stripe lookup keys.
- A **sync script** (`pnpm stripe:sync`, lands in Phase 8) reads from Postgres and idempotently creates or updates the matching products and prices in the configured Stripe account, storing the resulting `stripe_product_id` and `stripe_price_id` back on the corresponding rows.
- The pricing page (`/pricing`, lands in Phase 11) renders from `products` and `prices` joined in Postgres. It does not call Stripe on the read path.
- Stripe Checkout sessions are created with the `stripe_price_id` looked up from Postgres at the moment the user clicks "Subscribe."
- Webhooks (Phase 9) reconcile the **subscription state** between Stripe and Postgres. They do not reconcile prices — prices flow only DB → Stripe, never the reverse.
- The Stripe dashboard is treated as **read-only** for the pricing structure. Manual edits in the dashboard are drift and must be corrected by re-running the sync script.

---

## Consequences

### Positive

- **Single source of truth.** Pricing changes flow through git: edit the seed file, open a PR, review, merge, deploy, run sync. No "who changed the dashboard?" forensics.
- **Reproducible environments.** A new Stripe test account is provisioned by running the sync script once. Preview branches inherit the same products without manual setup.
- **Pricing page is fast.** The render path is one Postgres query. Stripe API latency does not enter the user's hot path.
- **Entitlements have a stable foreign-key ancestor.** Every entitlement row points at a `prices.id` (and through it a `products.id`) that is a real, queryable, joinable row in the same database as the user's other data.
- **Schema migrations evolve naturally.** Adding a new tier is a `products` insert and a sync run. Removing a tier is a status flag and a sync run. There is no "delete product in Stripe, but keep grandfathered subscriptions working" choreography to invent.
- **A/B tests on pricing are tractable.** The pricing page can branch on `prices` rows tagged with experiment IDs without touching Stripe at all.
- **Compliance and audit are in version control.** Pricing diffs live in git and link to PRs. SOC 2 and tax-jurisdiction reviews trace pricing decisions to authors and dates.

### Negative

- **The sync script is now critical infrastructure.** It must be idempotent, re-runnable, dry-run capable, and tested in CI. Phase 8 must invest in this.
- **Drift detection becomes our problem.** If someone edits the Stripe dashboard, our DB and Stripe diverge silently until a webhook references a missing price ID. Mitigation is a periodic drift-check job (lands as part of Phase 14 hardening) plus a strict policy that the dashboard is read-only.
- **Two systems to update for every price change.** The DB write happens in code review; the Stripe write happens via the sync script. Forgetting to run the script means Checkout fails for the new price. Mitigation: the deploy pipeline (Phase 14) runs `stripe:sync --check` as a gate.
- **Trial logic is more complex.** A 30-day Pro trial without card (per VISION) is granted by writing an `entitlements` row server-side, not by creating a trialing subscription in Stripe. Conversion to paid creates the Stripe subscription on Checkout. This is the right shape but it requires careful state-machine documentation.

### Neutral

- This pattern is industry-standard at Vercel, Linear, Resend, Sentry, and most serious B2B SaaS. The cost of choosing it is low; the cost of choosing the opposite path and migrating later is high.
- Stripe's own product team has, in recent years, oriented documentation around this pattern (search "Stripe Catalog Sync"). Stripe is not fighting this approach — they support it.

---

## Alternatives Considered

### Alternative 1: Stripe-as-source-of-truth (Path A)

**Pros:**
- Less code to write up front. No `products` / `prices` schema, no sync script.
- The Stripe dashboard is genuinely good UX for marketing-led pricing changes.
- New developers familiar with Stripe can navigate it from day one.

**Cons:**
- Pricing page renders require either Stripe API calls (latency) or a cache (which is "dynamic pricing from a cache" — the same pattern, less robust).
- Per-environment Stripe accounts must be hand-stocked, repeatedly, by humans.
- Dashboard edits are not version-controlled. Audit trails depend on Stripe's logs, which are not joinable to anything else we own.
- Entitlements have nowhere stable to anchor — the foreign keys point to remote IDs whose canonical record is Stripe.
- Migrating off Stripe (or to a second processor — Paddle, Lemonsqueezy, an enterprise contract path) requires reverse-engineering pricing back out of Stripe.

**Why rejected:** Every con compounds over time. The convenience of dashboard-led pricing is real for the first 90 days and a permanent operational tax thereafter.

### Alternative 2: Hybrid (DB caches Stripe, Stripe is source of truth)

**Pros:**
- Pricing page renders fast (from cache).
- Stripe dashboard remains the editing surface for marketing.

**Cons:**
- Cache invalidation is now our problem. Pricing changes in Stripe must propagate to our cache via webhook, with retry, ordering, and tombstone semantics.
- Drift can flow either direction — cache stale, Stripe edited but webhook missed, etc.
- Audit trail still lives in Stripe, not in git.
- Entitlements still anchor to Stripe IDs (the cache is a cache, not a source of truth).

**Why rejected:** Caches that pretend to be sources of truth are a documented antipattern. Either own the data or don't. Half-owning it is the worst of both.

### Alternative 3: Defer the decision; hard-code pricing in code

**Pros:**
- Zero infrastructure on day one.
- Easy to reason about while there are only three tiers.

**Cons:**
- Hard-coded pricing is fine until the second week, when annual pricing is added, then the third week, when an enterprise contract is negotiated, then the fourth week, when a coupon launches.
- Schema retrofitting at that point disrupts active subscriptions.
- The Stripe Checkout session must reference some price ID — that ID is either hard-coded (brittle) or derived (which means we have a derivation, which means we've reinvented `prices` table).

**Why rejected:** Hard-coded pricing is fake simplicity. We'd build the schema by Phase 9 anyway.

### Alternative 4: Do nothing (no billing)

Not applicable — Lumen is a paid product. Free tier exists but is monetized via Pro/Studio conversion (per `LUMEN_VISION.md` § Pricing & Tiers). Defer is not a choice.

---

## Implementation Notes

- The `products` table includes a `tier` column (`free` | `pro` | `studio`) as an enum, plus a JSONB `feature_manifest` field that drives the pricing page feature comparison without code changes.
- The `prices` table includes a `lookup_key` (e.g. `pro_monthly_v1`, `pro_annual_v1`). When a price changes, we create a new row with a new `lookup_key` and mark the old row as `inactive`. The sync script preserves both in Stripe so existing subscriptions on the old price are not disrupted.
- The sync script accepts `--env=production|staging|dev` and `--dry-run`. CI runs `--dry-run` against the production Stripe key on every PR that touches `billing.ts` schemas or seed files; the resulting plan is posted as a PR comment.
- The Phase 1 schema PR for `billing.ts` lands the tables; the Phase 8 PR adds the sync script, the Stripe SDK wiring, and the CI gate.
- A drift-detection cron job (Phase 14) runs nightly: query Postgres for active prices, query Stripe for active prices in the same currency, alert on mismatch.
- The Free tier has a `products` row but no `prices` row (price = $0 → no Stripe price needed). The Free tier is enforced by entitlements; there is no Stripe subscription for free users.
- The 30-day Pro trial is implemented entirely in our DB: on signup, a row is inserted into `entitlements` with `tier='pro'` and `expires_at = now() + 30 days`. No Stripe customer is created for trial-only users. Conversion to paid creates the Stripe customer + subscription via Checkout.
- The customer portal (Phase 12) is Stripe-hosted but launched from a server-side endpoint that exchanges our `user_id` for a Stripe customer ID looked up from `subscriptions.stripe_customer_id`. The portal cannot change pricing — it can only change which existing price the user is on.

---

## References

- [Stripe Catalog Sync pattern](https://docs.stripe.com/products-prices)
- [Stripe Idempotent Requests](https://docs.stripe.com/api/idempotent_requests)
- [Stripe Webhook Best Practices](https://docs.stripe.com/webhooks/best-practices)
- Related: [ADR-002: Database — Neon Postgres](./002-database-neon-postgres.md)
- Related: [ADR-003: ORM — Drizzle](./003-orm-drizzle.md)
- Related: `ARCHITECTURE.md` §7 Billing Architecture
- Related: `LUMEN_VISION.md` § Pricing & Tiers

---

## Review & Revision History

| Date | Author | Change |
|---|---|---|
| 2026-04-24 | @billyribeiro-ux | Initial draft — accepted |
