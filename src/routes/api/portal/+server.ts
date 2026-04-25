// POST /api/portal — exchange the user's Stripe customer id for a
// Billing Portal session URL and redirect.

import { error, type RequestHandler, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { requireUser } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { subscriptions } from '$lib/server/db/schema/billing';
import { getStripe, isStripeConfigured } from '$lib/server/stripe/client';

export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  if (!isStripeConfigured()) error(503, 'Billing is not configured.');

  const [sub] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  if (!sub?.stripeCustomerId) error(404, 'No Stripe customer linked to this account.');

  const baseUrl = process.env['BETTER_AUTH_URL'] ?? event.url.origin;
  const session = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/account/billing`,
  });

  throw redirect(303, session.url);
};
