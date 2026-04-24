// Billing seed — products + prices.
//
// Subscriptions, invoices, payment methods, and entitlements are
// seeded later (per-org) in runners/orgs.ts after we know each org's
// id. Stripe IDs are NOT populated here — `pnpm stripe:sync` (Phase 8)
// fills `stripe_product_id` / `stripe_price_id` later.

import { eq } from 'drizzle-orm';
import {
  type PriceInterval,
  type ProductTier,
  prices,
  products,
} from '../../../src/lib/server/db/schema/billing';
import type { SeedDb } from '../connection';

interface ProductFixture {
  tier: ProductTier;
  name: string;
  description: string;
  sortOrder: number;
  featureManifest: Record<string, unknown>;
}

interface PriceFixture {
  tier: ProductTier;
  lookupKey: string;
  interval: PriceInterval;
  /** Cents */
  unitAmount: number;
}

const PRODUCTS: readonly ProductFixture[] = [
  {
    tier: 'free',
    name: 'Free',
    description: '100 nodes, 1 project, no AI, no desktop, no publishing.',
    sortOrder: 0,
    featureManifest: {
      maxNodes: 100,
      maxProjects: 1,
      aiQueriesPerMonth: 0,
      canPublish: false,
      canUseDesktop: false,
      maxSeats: 1,
    },
  },
  {
    tier: 'pro',
    name: 'Pro',
    description:
      'Unlimited nodes + projects, AI co-pilot (100 queries/mo), desktop app, publishing, graph, snippets.',
    sortOrder: 1,
    featureManifest: {
      maxNodes: -1,
      maxProjects: -1,
      aiQueriesPerMonth: 100,
      canPublish: true,
      canUseDesktop: true,
      maxSeats: 1,
    },
  },
  {
    tier: 'studio',
    name: 'Studio',
    description:
      'Everything in Pro + unlimited AI + 5 seats + custom subdomain + API access + advanced export.',
    sortOrder: 2,
    featureManifest: {
      maxNodes: -1,
      maxProjects: -1,
      aiQueriesPerMonth: -1,
      canPublish: true,
      canUseDesktop: true,
      maxSeats: 5,
      customSubdomain: true,
      apiAccess: true,
      advancedExport: true,
    },
  },
];

const PRICES: readonly PriceFixture[] = [
  // Pro
  { tier: 'pro', lookupKey: 'pro_monthly_v1', interval: 'month', unitAmount: 2000 },
  { tier: 'pro', lookupKey: 'pro_annual_v1', interval: 'year', unitAmount: 20000 },
  // Studio
  { tier: 'studio', lookupKey: 'studio_monthly_v1', interval: 'month', unitAmount: 4000 },
  { tier: 'studio', lookupKey: 'studio_annual_v1', interval: 'year', unitAmount: 40000 },
  // Free has no Stripe price.
];

export async function seedBilling(db: SeedDb): Promise<Map<ProductTier, string>> {
  // Insert / refresh products (idempotent on tier UNIQUE).
  for (const fixture of PRODUCTS) {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.tier, fixture.tier))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(products).values({
        tier: fixture.tier,
        name: fixture.name,
        description: fixture.description,
        sortOrder: fixture.sortOrder,
        featureManifest: fixture.featureManifest,
        isActive: true,
      });
    }
  }

  // Map tier → product id for prices + downstream subscription seeds.
  const allProducts = await db.select({ id: products.id, tier: products.tier }).from(products);
  const productIdByTier = new Map<ProductTier, string>(allProducts.map((p) => [p.tier, p.id]));

  // Insert prices (idempotent on lookup_key UNIQUE).
  for (const fixture of PRICES) {
    const productId = productIdByTier.get(fixture.tier);
    if (!productId) continue;
    const existing = await db
      .select({ id: prices.id })
      .from(prices)
      .where(eq(prices.lookupKey, fixture.lookupKey))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(prices).values({
        productId,
        lookupKey: fixture.lookupKey,
        interval: fixture.interval,
        currency: 'usd',
        unitAmount: fixture.unitAmount,
        isActive: true,
      });
    }
  }

  return productIdByTier;
}
