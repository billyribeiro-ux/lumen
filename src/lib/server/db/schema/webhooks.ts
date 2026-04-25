// Webhook events — inbound webhook idempotency and replay (ARCHITECTURE.md §7.5).
//
// Every event from Stripe / Resend / Anthropic is persisted here,
// keyed by the provider's event id. The handler is idempotent on the
// (provider, event_id) uniqueness; a second arrival is a no-op.

import { sql } from 'drizzle-orm';
import { index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { idColumn } from './_columns';

export const webhookProviderEnum = pgEnum('webhook_provider', ['stripe', 'resend', 'anthropic']);
export type WebhookProvider = (typeof webhookProviderEnum.enumValues)[number];

export const webhookStatusEnum = pgEnum('webhook_status', [
  'received',
  'processing',
  'processed',
  'failed',
  'skipped',
]);
export type WebhookStatus = (typeof webhookStatusEnum.enumValues)[number];

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: idColumn(),
    provider: webhookProviderEnum('provider').notNull(),
    // Provider-emitted event id (Stripe evt_..., Resend evt_..., etc.).
    providerEventId: text('provider_event_id').notNull(),
    eventType: text('event_type').notNull(),
    status: webhookStatusEnum('status').notNull().default('received'),
    // Raw payload for replay + audit. May include full provider body.
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    // Last error message if status='failed'; cleared on a successful retry.
    lastError: text('last_error'),
    retryCount: text('retry_count').notNull().default('0'),
    processedAt: timestamp('processed_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('webhook_events_provider_event_unique').on(table.provider, table.providerEventId),
    index('webhook_events_status_idx').on(table.status),
    index('webhook_events_created_idx').on(table.createdAt),
  ],
);
