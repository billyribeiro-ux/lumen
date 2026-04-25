// POST /api/checkout — create a Stripe Checkout session for the
// authenticated user's active organization.

import { error, type RequestHandler, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { requireUser } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { prices } from '$lib/server/db/schema/billing';
import { getStripe, isStripeConfigured } from '$lib/server/stripe/client';

export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  const orgId = event.cookies.get('lumen.org');
  if (!orgId) error(400, 'No active organization.');

  if (!isStripeConfigured()) {
    error(503, 'Billing is not configured. Set STRIPE_SECRET_KEY in the environment.');
  }

  const data = await event.request.formData();
  const lookupKey = String(data.get('lookupKey') ?? '');
  if (!lookupKey) error(400, 'lookupKey is required.');

  const [priceRow] = await db
    .select({
      id: prices.id,
      stripePriceId: prices.stripePriceId,
    })
    .from(prices)
    .where(eq(prices.lookupKey, lookupKey))
    .limit(1);

  if (!priceRow?.stripePriceId) {
    error(503, 'Selected plan is not synced to Stripe yet. Run `pnpm stripe:sync`.');
  }

  const stripe = getStripe();
  const baseUrl = process.env['BETTER_AUTH_URL'] ?? event.url.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    client_reference_id: user.id,
    line_items: [{ price: priceRow.stripePriceId, quantity: 1 }],
    subscription_data: {
      metadata: {
        organization_id: orgId,
        user_id: user.id,
      },
      ...(lookupKey.startsWith('pro_') ? { trial_period_days: 30 } : {}),
    },
    success_url: `${baseUrl}/account/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing?canceled=1`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    metadata: {
      organization_id: orgId,
      user_id: user.id,
      lookup_key: lookupKey,
    },
  });

  if (!session.url) error(500, 'Stripe did not return a checkout URL.');
  throw redirect(303, session.url);
};
