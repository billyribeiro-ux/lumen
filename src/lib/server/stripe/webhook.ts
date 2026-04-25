// Stripe webhook signature verification + idempotency-keyed event log.
//
// Lifecycle:
//   1. Receive POST /api/webhooks/stripe.
//   2. constructEvent() validates X-Stripe-Signature against
//      STRIPE_WEBHOOK_SECRET. Throws on tampering.
//   3. recordWebhookEvent() inserts into webhook_events with the
//      provider event id as the idempotency anchor; returns whether
//      this is a fresh event or a duplicate.
//   4. Caller dispatches by event.type (Phase 9 wires the handlers).
//   5. markWebhookProcessed() / markWebhookFailed() updates the row.

import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { db } from '../db';
import { webhookEvents } from '../db/schema/webhooks';
import { getStripe } from './client';

const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];

export function constructEvent(rawBody: string, signature: string): Stripe.Event {
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
}

export interface RecordedEvent {
  /** Internal row id. */
  id: string;
  /** True if this row was newly inserted; false if a duplicate was found. */
  fresh: boolean;
}

export async function recordWebhookEvent(event: Stripe.Event): Promise<RecordedEvent> {
  // Try insert; on conflict return the existing row.
  const inserted = await db
    .insert(webhookEvents)
    .values({
      provider: 'stripe',
      providerEventId: event.id,
      eventType: event.type,
      status: 'received',
      payload: event as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing({ target: [webhookEvents.provider, webhookEvents.providerEventId] })
    .returning({ id: webhookEvents.id });

  if (inserted[0]) return { id: inserted[0].id, fresh: true };

  const existing = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.providerEventId, event.id))
    .limit(1);

  if (!existing[0]) {
    throw new Error('Failed to record or locate webhook event.');
  }
  return { id: existing[0].id, fresh: false };
}

export async function markWebhookProcessed(rowId: string): Promise<void> {
  await db
    .update(webhookEvents)
    .set({ status: 'processed', processedAt: new Date(), lastError: null })
    .where(eq(webhookEvents.id, rowId));
}

export async function markWebhookFailed(rowId: string, err: unknown): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  await db
    .update(webhookEvents)
    .set({ status: 'failed', lastError: message })
    .where(eq(webhookEvents.id, rowId));
}
