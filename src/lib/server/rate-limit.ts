// Lumen rate limiting — Upstash Redis sliding window.
//
// Three named limiters:
//   - auth     5 attempts / 60s per IP+email   (sign-in, sign-up, reset)
//   - api      120 req / 60s per user         (default app API)
//   - webhook  300 req / 60s per provider IP  (Stripe / Resend / Anthropic)
//
// If UPSTASH_REDIS_REST_URL is unset (local dev without Upstash), the
// limiter no-ops — every request is allowed. This keeps the dev path
// dependency-free; production must configure the env vars.

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const url = process.env['UPSTASH_REDIS_REST_URL'];
const token = process.env['UPSTASH_REDIS_REST_TOKEN'];

const redis =
  url && token
    ? new Redis({
        url,
        token,
      })
    : null;

const make = (limit: number, window: `${number} s` | `${number} m`, prefix: string) =>
  redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        analytics: true,
        prefix,
      })
    : null;

const limiters = {
  auth: make(5, '60 s', 'lumen:rl:auth'),
  api: make(120, '60 s', 'lumen:rl:api'),
  webhook: make(300, '60 s', 'lumen:rl:webhook'),
} as const;

export type LimiterName = keyof typeof limiters;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  reset: number; // epoch ms
  limit: number;
}

export async function checkRateLimit(
  name: LimiterName,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = limiters[name];
  if (!limiter) {
    // Local dev fallback — Upstash not configured. Allow everything.
    return { ok: true, remaining: Infinity, reset: 0, limit: Infinity };
  }
  const res = await limiter.limit(identifier);
  return {
    ok: res.success,
    remaining: res.remaining,
    reset: res.reset,
    limit: res.limit,
  };
}

/**
 * Throw a SvelteKit 429 if the limiter denies. Caller passes the unique
 * identifier (e.g. `auth:${ip}:${email}` or `api:user:${userId}`).
 */
export async function enforceRateLimit(name: LimiterName, identifier: string): Promise<void> {
  const result = await checkRateLimit(name, identifier);
  if (!result.ok) {
    const seconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    const err = new Error(`Rate limit exceeded. Retry in ${seconds}s.`);
    (err as Error & { status: number; headers: Record<string, string> }).status = 429;
    (err as Error & { status: number; headers: Record<string, string> }).headers = {
      'Retry-After': String(seconds),
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.floor(result.reset / 1000)),
    };
    throw err;
  }
}
