// Billing schema — DB is the source of truth (ADR-006).
//
// Six tables: products, prices, subscriptions, invoices, payment_methods,
// entitlements. Stripe IDs are mirrored back from the sync script
// (Phase 8); the canonical record always lives here.

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditTimestamps, idColumn } from './_columns';
import { users } from './auth';
import { organizations } from './organizations';

// ── Enums ────────────────────────────────────────────────────────────

export const productTierEnum = pgEnum('product_tier', ['free', 'pro', 'studio']);
export type ProductTier = (typeof productTierEnum.enumValues)[number];

export const priceIntervalEnum = pgEnum('price_interval', ['month', 'year']);
export type PriceInterval = (typeof priceIntervalEnum.enumValues)[number];

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'unpaid',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'paused',
]);
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'open',
  'paid',
  'uncollectible',
  'void',
]);
export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];

// ── Tables ───────────────────────────────────────────────────────────

export const products = pgTable(
  'products',
  {
    id: idColumn(),
    tier: productTierEnum('tier').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    // Feature manifest renders the pricing-page checkmarks. Shape is
    // validated at the application layer (valibot) before write.
    featureManifest: jsonb('feature_manifest').notNull().default(sql`'{}'::jsonb`),
    // Stripe product id mirrored after `pnpm stripe:sync`. Null until synced.
    stripeProductId: text('stripe_product_id'),
    isActive: boolean('is_active').notNull().default(true),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('products_tier_unique').on(table.tier),
    uniqueIndex('products_stripe_unique').on(table.stripeProductId),
  ],
);

export const prices = pgTable(
  'prices',
  {
    id: idColumn(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    // Lookup key for stable referencing across sync runs (e.g. pro_monthly_v1).
    lookupKey: text('lookup_key').notNull(),
    interval: priceIntervalEnum('interval').notNull(),
    // ISO 4217 currency code, lower-case (USD, EUR, ...).
    currency: text('currency').notNull().default('usd'),
    // Amount in the smallest currency unit (cents). 2000 = $20.00.
    unitAmount: integer('unit_amount').notNull(),
    stripePriceId: text('stripe_price_id'),
    isActive: boolean('is_active').notNull().default(true),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('prices_lookup_key_unique').on(table.lookupKey),
    uniqueIndex('prices_stripe_unique').on(table.stripePriceId),
    index('prices_product_idx').on(table.productId),
  ],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: idColumn(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    priceId: uuid('price_id')
      .notNull()
      .references(() => prices.id, { onDelete: 'restrict' }),
    status: subscriptionStatusEnum('status').notNull(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true, mode: 'date' }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true, mode: 'date' }),
    trialStart: timestamp('trial_start', { withTimezone: true, mode: 'date' }),
    trialEnd: timestamp('trial_end', { withTimezone: true, mode: 'date' }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    canceledAt: timestamp('canceled_at', { withTimezone: true, mode: 'date' }),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('subscriptions_stripe_subscription_unique').on(table.stripeSubscriptionId),
    index('subscriptions_org_idx').on(table.organizationId),
    index('subscriptions_user_idx').on(table.userId),
    index('subscriptions_status_idx').on(table.status),
  ],
);

export const invoices = pgTable(
  'invoices',
  {
    id: idColumn(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, {
      onDelete: 'set null',
    }),
    stripeInvoiceId: text('stripe_invoice_id'),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    currency: text('currency').notNull().default('usd'),
    totalAmount: integer('total_amount').notNull().default(0),
    amountPaid: integer('amount_paid').notNull().default(0),
    amountDue: integer('amount_due').notNull().default(0),
    hostedInvoiceUrl: text('hosted_invoice_url'),
    invoicePdfUrl: text('invoice_pdf_url'),
    paidAt: timestamp('paid_at', { withTimezone: true, mode: 'date' }),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('invoices_stripe_unique').on(table.stripeInvoiceId),
    index('invoices_org_idx').on(table.organizationId),
    index('invoices_subscription_idx').on(table.subscriptionId),
  ],
);

export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: idColumn(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripePaymentMethodId: text('stripe_payment_method_id').notNull(),
    type: text('type').notNull(),
    // Last four digits of the card or last segment of the bank account.
    // Display only — no PAN is ever stored.
    last4: text('last4'),
    brand: text('brand'),
    expMonth: integer('exp_month'),
    expYear: integer('exp_year'),
    isDefault: boolean('is_default').notNull().default(false),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('payment_methods_stripe_unique').on(table.stripePaymentMethodId),
    index('payment_methods_org_idx').on(table.organizationId),
    index('payment_methods_user_idx').on(table.userId),
  ],
);

export const entitlements = pgTable(
  'entitlements',
  {
    id: idColumn(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    // Cached tier resolved from the active subscription (or 'pro' during trial).
    tier: productTierEnum('tier').notNull().default('free'),
    // Per-feature limits as JSONB so adding a new gate doesn't migrate.
    limits: jsonb('limits').notNull().default(sql`'{}'::jsonb`),
    // Trial expiry — when this passes and there is no paying subscription, tier downgrades to free.
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true, mode: 'date' }),
    // Last reconciliation timestamp from the entitlements derivation job.
    lastReconciledAt: timestamp('last_reconciled_at', { withTimezone: true, mode: 'date' }),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex('entitlements_org_user_unique').on(table.organizationId, table.userId),
    index('entitlements_org_idx').on(table.organizationId),
    index('entitlements_tier_idx').on(table.tier),
  ],
);
