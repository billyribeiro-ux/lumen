import { json, type RequestHandler } from '@sveltejs/kit';
import type Stripe from 'stripe';
import {
  constructEvent,
  markWebhookFailed,
  markWebhookProcessed,
  recordWebhookEvent,
} from '$lib/server/stripe/webhook';

export const POST: RequestHandler = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  if (!sig) return json({ error: 'missing signature' }, { status: 400 });

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = constructEvent(rawBody, sig);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bad signature.';
    return json({ error: message }, { status: 400 });
  }

  const recorded = await recordWebhookEvent(event);
  if (!recorded.fresh) {
    // Idempotency replay — already processed. Stripe will retry on non-2xx,
    // so respond 200 to acknowledge.
    return json({ ok: true, replay: true });
  }

  try {
    // Phase 9 wires the dispatch table:
    //   customer.subscription.* → subscription state machine
    //   invoice.* → invoice mirror
    //   payment_method.* → payment-method mirror
    // For now, log and mark processed. Webhook event persisted in
    // webhook_events for replay once handlers ship.
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'stripe.webhook.received',
        type: event.type,
        id: event.id,
      }),
    );
    await markWebhookProcessed(recorded.id);
    return json({ ok: true });
  } catch (err) {
    await markWebhookFailed(recorded.id, err);
    // Return 500 so Stripe retries (with idempotency replay safety).
    return json({ error: 'handler failed' }, { status: 500 });
  }
};
