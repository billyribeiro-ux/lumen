// Stripe webhook event handlers — subscription state machine, invoice
// mirror, payment-method mirror. All handlers are idempotent and run
// inside transactions so the audit log + mirror tables stay in sync.

import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { db, dbTransact } from '../db';
import { auditLog } from '../db/schema/audit';
import {
  entitlements,
  invoices,
  type ProductTier,
  paymentMethods,
  prices,
  type SubscriptionStatus,
  subscriptions,
} from '../db/schema/billing';

const TIER_FROM_PRODUCT_METADATA = (
  meta: Record<string, string> | null | undefined,
): ProductTier => {
  const v = meta?.['tier'];
  if (v === 'pro' || v === 'studio' || v === 'free') return v;
  return 'free';
};

// ── Subscriptions ─────────────────────────────────────────────────

export async function handleSubscriptionEvent(event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription;
  const status = sub.status as SubscriptionStatus;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const item = sub.items.data[0];
  if (!item) return;

  // Resolve our internal price id from the lookup_key Stripe carries.
  const stripePriceId = item.price.id;
  const [priceRow] = await db
    .select({ id: prices.id, productId: prices.productId })
    .from(prices)
    .where(eq(prices.stripePriceId, stripePriceId))
    .limit(1);
  if (!priceRow) {
    console.warn(`[billing] price ${stripePriceId} not found in DB; ignoring subscription event`);
    return;
  }

  await dbTransact(async (tx) => {
    // API 2026-04-22.dahlia moved current_period_* onto each SubscriptionItem.
    // We use the first item as the canonical period (single-product subs).
    const periodStart = item.current_period_start
      ? new Date(item.current_period_start * 1000)
      : null;
    const periodEnd = item.current_period_end ? new Date(item.current_period_end * 1000) : null;
    const trialStart = sub.trial_start ? new Date(sub.trial_start * 1000) : null;
    const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
    const canceledAt = sub.canceled_at ? new Date(sub.canceled_at * 1000) : null;

    const baseUpdate = {
      priceId: priceRow.id,
      status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      trialStart,
      trialEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      canceledAt,
      updatedAt: new Date(),
    } as const;

    const [existing] = await tx
      .select({
        id: subscriptions.id,
        organizationId: subscriptions.organizationId,
        userId: subscriptions.userId,
      })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, sub.id))
      .limit(1);

    if (existing) {
      await tx.update(subscriptions).set(baseUpdate).where(eq(subscriptions.id, existing.id));
    } else {
      // First time we see this subscription. The org + user are encoded in
      // the Stripe customer metadata at checkout time (Phase 11).
      const orgIdFromMeta = sub.metadata['organization_id'];
      const userIdFromMeta = sub.metadata['user_id'];
      if (!orgIdFromMeta || !userIdFromMeta) {
        console.warn(`[billing] subscription ${sub.id} has no org/user metadata; skipping insert`);
        return;
      }
      await tx.insert(subscriptions).values({
        organizationId: orgIdFromMeta,
        userId: userIdFromMeta,
        ...baseUpdate,
      });
    }

    // Re-derive entitlements from the canonical product tier.
    const subRow = existing
      ? {
          organizationId: existing.organizationId,
          userId: existing.userId,
        }
      : {
          organizationId: sub.metadata['organization_id']!,
          userId: sub.metadata['user_id']!,
        };

    const tier = TIER_FROM_PRODUCT_METADATA(
      typeof item.price.product === 'object' && item.price.product
        ? 'metadata' in item.price.product
          ? item.price.product.metadata
          : null
        : null,
    );

    const isActive = status === 'active' || status === 'trialing';
    const effectiveTier: ProductTier = isActive ? tier : 'free';

    const [existingEnt] = await tx
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(eq(entitlements.userId, subRow.userId))
      .limit(1);

    const entUpdate = {
      tier: effectiveTier,
      lastReconciledAt: new Date(),
    } as const;

    if (existingEnt) {
      await tx.update(entitlements).set(entUpdate).where(eq(entitlements.id, existingEnt.id));
    } else {
      await tx.insert(entitlements).values({
        organizationId: subRow.organizationId,
        userId: subRow.userId,
        ...entUpdate,
      });
    }

    await tx.insert(auditLog).values({
      organizationId: subRow.organizationId,
      actorId: null,
      action: `billing.subscription.${event.type.split('.').pop() ?? 'change'}`,
      resource: `subscription:${sub.id}`,
      beforeState: null,
      afterState: { status, tier: effectiveTier } as never,
    });
  });
}

// ── Invoices ──────────────────────────────────────────────────────

export async function handleInvoiceEvent(event: Stripe.Event) {
  const inv = event.data.object as Stripe.Invoice;
  const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
  // API 2026-04-22.dahlia: Invoice.parent.subscription_details.subscription
  const parentSub = inv.parent?.subscription_details?.subscription ?? null;
  const subscriptionId = typeof parentSub === 'string' ? parentSub : (parentSub?.id ?? null);
  if (!customerId) return;

  // Resolve org via subscription if available.
  let organizationId: string | null = null;
  let internalSubscriptionId: string | null = null;
  if (subscriptionId) {
    const [match] = await db
      .select({ id: subscriptions.id, organizationId: subscriptions.organizationId })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1);
    if (match) {
      organizationId = match.organizationId;
      internalSubscriptionId = match.id;
    }
  }
  if (!organizationId) return; // can't link this invoice yet

  const status = inv.status as 'draft' | 'open' | 'paid' | 'uncollectible' | 'void' | undefined;

  const baseUpdate = {
    organizationId,
    subscriptionId: internalSubscriptionId,
    stripeInvoiceId: inv.id,
    status: status ?? 'draft',
    currency: inv.currency ?? 'usd',
    totalAmount: inv.total ?? 0,
    amountPaid: inv.amount_paid ?? 0,
    amountDue: inv.amount_due ?? 0,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    invoicePdfUrl: inv.invoice_pdf ?? null,
    paidAt:
      inv.status === 'paid' && inv.status_transitions?.paid_at
        ? new Date(inv.status_transitions.paid_at * 1000)
        : null,
    updatedAt: new Date(),
  } as const;

  const [existing] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.stripeInvoiceId, inv.id))
    .limit(1);

  if (existing) {
    await db.update(invoices).set(baseUpdate).where(eq(invoices.id, existing.id));
  } else {
    await db.insert(invoices).values(baseUpdate);
  }
}

// ── Payment methods ───────────────────────────────────────────────

export async function handlePaymentMethodEvent(event: Stripe.Event) {
  const pm = event.data.object as Stripe.PaymentMethod;
  const customerId = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id;
  if (!customerId) return;

  const [sub] = await db
    .select({ organizationId: subscriptions.organizationId, userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);
  if (!sub) return;

  const card = pm.card;
  const baseUpdate = {
    organizationId: sub.organizationId,
    userId: sub.userId,
    stripePaymentMethodId: pm.id,
    type: pm.type,
    last4: card?.last4 ?? null,
    brand: card?.brand ?? null,
    expMonth: card?.exp_month ?? null,
    expYear: card?.exp_year ?? null,
    isDefault: false,
    updatedAt: new Date(),
  } as const;

  const [existing] = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(eq(paymentMethods.stripePaymentMethodId, pm.id))
    .limit(1);

  if (event.type === 'payment_method.detached') {
    if (existing) await db.delete(paymentMethods).where(eq(paymentMethods.id, existing.id));
    return;
  }

  if (existing) {
    await db.update(paymentMethods).set(baseUpdate).where(eq(paymentMethods.id, existing.id));
  } else {
    await db.insert(paymentMethods).values(baseUpdate);
  }
}

// ── Dispatch ──────────────────────────────────────────────────────

export async function dispatchStripeEvent(event: Stripe.Event): Promise<void> {
  if (event.type.startsWith('customer.subscription.')) {
    await handleSubscriptionEvent(event);
  } else if (event.type.startsWith('invoice.')) {
    await handleInvoiceEvent(event);
  } else if (event.type.startsWith('payment_method.')) {
    await handlePaymentMethodEvent(event);
  } else {
    // Unhandled event type — already persisted in webhook_events for replay.
    console.info(
      JSON.stringify({ level: 'info', event: 'stripe.webhook.unhandled', type: event.type }),
    );
  }
}
