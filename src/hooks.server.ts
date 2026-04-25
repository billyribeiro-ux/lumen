// SvelteKit server hooks — auth session resolution, route guards, CSP,
// and per-request rate limiting on hot auth endpoints.

import { type Handle, type HandleServerError, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from '$lib/server/auth';
import { checkRateLimit } from '$lib/server/rate-limit';

const PUBLIC_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/magic-link',
  '/invite',
  '/api/auth',
  '/p/',
];

const isPublic = (pathname: string): boolean => {
  if (pathname === '/' || pathname === '/pricing' || pathname === '/about') return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

const session: Handle = async ({ event, resolve }) => {
  const result = await auth.api.getSession({ headers: event.request.headers });
  event.locals.session = result?.session ?? null;
  event.locals.user = result?.user ?? null;
  return resolve(event);
};

const guard: Handle = async ({ event, resolve }) => {
  if (!event.locals.user && !isPublic(event.url.pathname)) {
    const next = event.url.pathname + event.url.search;
    throw redirect(303, `/sign-in?next=${encodeURIComponent(next)}`);
  }
  return resolve(event);
};

const rateLimit: Handle = async ({ event, resolve }) => {
  // Limit only the hot-fail endpoints — sign-in, sign-up, password reset,
  // magic-link request. Authenticated traffic uses the `api` limiter
  // (wired in remote functions / form actions, not here).
  const path = event.url.pathname;
  const RATE_LIMITED = ['/sign-in', '/sign-up', '/forgot-password', '/api/auth/sign-in/email'];
  if (RATE_LIMITED.some((p) => path.startsWith(p))) {
    const id = `auth:${event.getClientAddress()}`;
    const result = await checkRateLimit('auth', id);
    if (!result.ok) {
      const retry = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      return new Response('Too many attempts. Please try again later.', {
        status: 429,
        headers: {
          'Retry-After': String(retry),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(result.reset / 1000)),
        },
      });
    }
  }
  return resolve(event);
};

const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  // CSP per ARCHITECTURE.md §12.3.
  response.headers.set(
    'content-security-policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com https://api.resend.com https://api.anthropic.com https://*.upstash.io",
      'frame-src https://js.stripe.com',
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  );
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
  return response;
};

export const handle: Handle = sequence(session, guard, rateLimit, securityHeaders);

export const handleError: HandleServerError = ({ error, event, status, message }) => {
  const errorId = crypto.randomUUID();
  console.error(
    JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      errorId,
      status,
      message,
      route: event.route.id,
      method: event.request.method,
      path: event.url.pathname,
      userId: event.locals.user?.id ?? null,
      detail:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : String(error),
    }),
  );
  return { message, errorId };
};
