// Lumen Stripe client — lazy singleton.
//
// Per ADR-006: the database is the source of truth for products and
// prices. The Stripe client is a processor; we read state from
// webhooks and write state via the sync script.

import Stripe from 'stripe';

// Read lazily at first use rather than throwing at module load — eager
// top-level throws break the production build's analyse step, where env
// vars are not injected. `getStripe()` fails fast on first real use.
const apiKey = process.env['STRIPE_SECRET_KEY'];

let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_client) {
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Stripe operations are disabled.');
    }
    _client = new Stripe(apiKey, {
      apiVersion: '2026-05-27.dahlia',
      appInfo: {
        name: 'Lumen',
        url: 'https://lumen.so',
      },
      maxNetworkRetries: 2,
    });
  }
  return _client;
}

export const isStripeConfigured = (): boolean => Boolean(apiKey);
