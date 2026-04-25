import { desc, eq } from 'drizzle-orm';
import { requireUser } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import {
  entitlements,
  invoices,
  paymentMethods,
  prices,
  products,
  subscriptions,
} from '$lib/server/db/schema/billing';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const user = requireUser(event);

  const [subscription] = await db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      trialEnd: subscriptions.trialEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      canceledAt: subscriptions.canceledAt,
      stripeCustomerId: subscriptions.stripeCustomerId,
      tier: products.tier,
      productName: products.name,
      lookupKey: prices.lookupKey,
      interval: prices.interval,
      unitAmount: prices.unitAmount,
      currency: prices.currency,
    })
    .from(subscriptions)
    .innerJoin(prices, eq(subscriptions.priceId, prices.id))
    .innerJoin(products, eq(prices.productId, products.id))
    .where(eq(subscriptions.userId, user.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const [entitlement] = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.userId, user.id))
    .limit(1);

  const recentInvoices = subscription
    ? await db
        .select({
          id: invoices.id,
          status: invoices.status,
          totalAmount: invoices.totalAmount,
          currency: invoices.currency,
          paidAt: invoices.paidAt,
          createdAt: invoices.createdAt,
          hostedInvoiceUrl: invoices.hostedInvoiceUrl,
        })
        .from(invoices)
        .where(eq(invoices.subscriptionId, subscription.id))
        .orderBy(desc(invoices.createdAt))
        .limit(10)
    : [];

  const cards = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.userId, user.id))
    .orderBy(desc(paymentMethods.updatedAt));

  return { subscription, entitlement, recentInvoices, cards };
};
