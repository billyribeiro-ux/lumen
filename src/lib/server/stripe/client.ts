// Lumen Stripe client — lazy singleton.
//
// Per ADR-006: the database is the source of truth for products and
// prices. The Stripe client is a processor; we read state from
// webhooks and write state via the sync script.

import Stripe from 'stripe';

const apiKey = process.env['STRIPE_SECRET_KEY'];
const isProduction = process.env['NODE_ENV'] === 'production';

if (isProduction && !apiKey) {
  throw new Error('STRIPE_SECRET_KEY is required in production.');
}

let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_client) {
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Stripe operations are disabled.');
    }
    _client = new Stripe(apiKey, {
      apiVersion: '2026-04-22.dahlia',
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
