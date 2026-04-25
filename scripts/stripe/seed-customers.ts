// Seed Stripe test customers for the seeded Lumen personas.
//
// Creates a Stripe Customer per Lumen Labs / Indie Studio / Free
// Hacker org owner using the Stripe test clock + standard test cards.
// Subscription states produced:
//   Lumen Labs (billy@lumen.so)     — active studio annual
//   Indie Studio (anna@indie.studio) — active pro monthly
//   Free Hacker (rachel@hacker.io)   — no subscription (free tier)
//
// Run after `pnpm db:seed` and `pnpm stripe:sync`.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... DATABASE_URL=... pnpm stripe:seed-customers

import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import Stripe from 'stripe';
import * as schema from '../../src/lib/server/db/schema';
import { users } from '../../src/lib/server/db/schema/auth';
import { type PriceInterval, prices, products } from '../../src/lib/server/db/schema/billing';
import { memberships, organizations } from '../../src/lib/server/db/schema/organizations';

const databaseUrl = process.env['DATABASE_URL'];
const stripeKey = process.env['STRIPE_SECRET_KEY'];

if (!databaseUrl) {
  console.error('[stripe:seed-customers] DATABASE_URL is required.');
  process.exit(1);
}
if (!stripeKey) {
  console.error('[stripe:seed-customers] STRIPE_SECRET_KEY is required.');
  process.exit(1);
}
if (!stripeKey.startsWith('sk_test_')) {
  console.error('[stripe:seed-customers] Refusing to run against a non-test key.');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: '2026-04-22.dahlia' });
const db = drizzle(neon(databaseUrl), { schema, casing: 'snake_case' });

interface PlanSeed {
  ownerEmail: string;
  orgSlug: string;
  tier: 'pro' | 'studio';
  interval: PriceInterval;
}

const PLANS: PlanSeed[] = [
  { ownerEmail: 'billy@lumen.so', orgSlug: 'lumen-labs', tier: 'studio', interval: 'year' },
  { ownerEmail: 'anna@indie.studio', orgSlug: 'indie-studio', tier: 'pro', interval: 'month' },
];

async function main() {
  for (const plan of PLANS) {
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, plan.ownerEmail))
      .limit(1);
    if (!user) {
      console.warn(`[seed-customers] no user ${plan.ownerEmail}`);
      continue;
    }

    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, plan.orgSlug))
      .limit(1);
    if (!org) continue;

    // Make sure owner is in the org (sanity check).
    const [member] = await db
      .select({ role: memberships.role })
      .from(memberships)
      .where(eq(memberships.userId, user.id))
      .limit(1);
    if (!member) continue;

    const [productRow] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.tier, plan.tier))
      .limit(1);
    if (!productRow) continue;

    const [priceRow] = await db
      .select({ id: prices.id, stripePriceId: prices.stripePriceId })
      .from(prices)
      .where(
        eq(prices.lookupKey, `${plan.tier}_${plan.interval === 'year' ? 'annual' : 'monthly'}_v1`),
      )
      .limit(1);
    if (!priceRow?.stripePriceId) {
      console.warn(
        `[seed-customers] price not synced for ${plan.tier}/${plan.interval} — run pnpm stripe:sync first`,
      );
      continue;
    }

    console.info(`[seed-customers] ${user.email} → ${plan.tier}/${plan.interval}`);

    // 1. Customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      description: `Lumen seed: ${plan.orgSlug}`,
      metadata: {
        organization_id: org.id,
        user_id: user.id,
        org_slug: plan.orgSlug,
      },
    });

    // 2. Attach a test payment method (the Stripe-provided test pm).
    await stripe.paymentMethods.attach('pm_card_visa', { customer: customer.id });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: 'pm_card_visa' },
    });

    // 3. Subscription with metadata so the webhook handler can resolve org/user.
    await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceRow.stripePriceId }],
      metadata: {
        organization_id: org.id,
        user_id: user.id,
        seed: 'true',
      },
    });
  }

  console.info('[seed-customers] done.');
}

main().catch((err) => {
  console.error('[seed-customers] failed:', err);
  process.exit(1);
});
