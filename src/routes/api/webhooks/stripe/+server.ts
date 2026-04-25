import { json, type RequestHandler } from '@sveltejs/kit';
import type Stripe from 'stripe';
import { dispatchStripeEvent } from '$lib/server/billing/handlers';
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
    await dispatchStripeEvent(event);
    await markWebhookProcessed(recorded.id);
    return json({ ok: true });
  } catch (err) {
    await markWebhookFailed(recorded.id, err);
    // Return 500 so Stripe retries (with idempotency replay safety).
    return json({ error: 'handler failed' }, { status: 500 });
  }
};
