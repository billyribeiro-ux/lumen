import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { prices, products } from '$lib/server/db/schema/billing';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(products.sortOrder);

  const priceRows = await db.select().from(prices).where(eq(prices.isActive, true));

  const byProduct: Record<string, typeof priceRows> = {};
  for (const p of priceRows) {
    if (!byProduct[p.productId]) byProduct[p.productId] = [];
    byProduct[p.productId]!.push(p);
  }

  return {
    products: productRows.map((p) => ({
      id: p.id,
      tier: p.tier,
      name: p.name,
      description: p.description,
      sortOrder: p.sortOrder,
      featureManifest: p.featureManifest,
      prices: byProduct[p.id] ?? [],
    })),
  };
};

void and; // available for future filtering by currency / lookup_key versions.
