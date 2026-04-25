// Idempotent DB → Stripe catalog sync (ADR-006).
//
// Walks every row in `products` and `prices` that doesn't yet have a
// stripe_*_id, creates the matching record in Stripe, and writes the
// resulting id back. For rows that already have a stripe_*_id, we
// `update` to push name/description/metadata changes.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... pnpm stripe:sync
//   STRIPE_SECRET_KEY=sk_test_... pnpm stripe:sync --dry-run
//
// Stripe is the destination; the database is the source of truth.

import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import Stripe from 'stripe';
import * as schema from '../../src/lib/server/db/schema';
import { prices, products } from '../../src/lib/server/db/schema/billing';

const databaseUrl = process.env['DATABASE_URL'];
const stripeKey = process.env['STRIPE_SECRET_KEY'];
const dryRun = process.argv.includes('--dry-run');

if (!databaseUrl) {
  console.error('[stripe:sync] DATABASE_URL is required.');
  process.exit(1);
}
if (!stripeKey) {
  console.error('[stripe:sync] STRIPE_SECRET_KEY is required.');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: '2026-04-22.dahlia' });
const db = drizzle(neon(databaseUrl), { schema, casing: 'snake_case' });

async function main() {
  console.info(`[stripe:sync] mode=${dryRun ? 'dry-run' : 'apply'}`);

  // Products ──────────────────────────────────────────────
  const productRows = await db.select().from(products);
  for (const row of productRows) {
    if (row.tier === 'free') continue; // Free tier has no Stripe product.

    if (!row.stripeProductId) {
      console.info(`[stripe:sync] CREATE product ${row.tier} (${row.name})`);
      if (!dryRun) {
        const created = await stripe.products.create({
          name: row.name,
          description: row.description,
          metadata: {
            tier: row.tier,
            lumen_product_id: row.id,
          },
        });
        await db
          .update(products)
          .set({ stripeProductId: created.id })
          .where(eq(products.id, row.id));
      }
    } else {
      console.info(`[stripe:sync] UPDATE product ${row.tier} (${row.stripeProductId})`);
      if (!dryRun) {
        await stripe.products.update(row.stripeProductId, {
          name: row.name,
          description: row.description,
          metadata: { tier: row.tier, lumen_product_id: row.id },
        });
      }
    }
  }

  // Prices — Stripe prices are immutable; create new and deactivate old.
  // For simplicity, this script only creates missing ids; price changes
  // require the operator to insert a new prices row with a new lookup_key
  // and mark the old row inactive.
  const priceRows = await db.select().from(prices);
  for (const row of priceRows) {
    if (row.stripePriceId) {
      console.info(`[stripe:sync] SKIP price ${row.lookupKey} (already linked)`);
      continue;
    }
    const productRow = productRows.find((p) => p.id === row.productId);
    if (!productRow?.stripeProductId) {
      console.warn(`[stripe:sync] WARN: product for ${row.lookupKey} has no stripe id`);
      continue;
    }
    console.info(`[stripe:sync] CREATE price ${row.lookupKey} (${row.unitAmount}/${row.interval})`);
    if (!dryRun) {
      const created = await stripe.prices.create({
        product: productRow.stripeProductId,
        currency: row.currency,
        unit_amount: row.unitAmount,
        recurring: { interval: row.interval },
        lookup_key: row.lookupKey,
        metadata: {
          lumen_price_id: row.id,
          tier: productRow.tier,
        },
      });
      await db.update(prices).set({ stripePriceId: created.id }).where(eq(prices.id, row.id));
    }
  }

  console.info('[stripe:sync] done.');
}

main().catch((err) => {
  console.error('[stripe:sync] failed:', err);
  process.exit(1);
});
