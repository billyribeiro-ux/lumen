// SvelteKit server hooks — auth session resolution + route guards.

import { type Handle, type HandleServerError, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

const PUBLIC_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/magic-link',
  '/invite',
  '/api/auth',
  '/p/', // public publications (Phase 18)
];

const isPublic = (pathname: string): boolean => {
  if (pathname === '/' || pathname === '/pricing' || pathname === '/about') return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

export const handle: Handle = async ({ event, resolve }) => {
  // 1. Resolve session.
  const session = await auth.api.getSession({ headers: event.request.headers });
  event.locals.session = session?.session ?? null;
  event.locals.user = session?.user ?? null;

  // 2. Route guard for protected paths.
  if (!event.locals.user && !isPublic(event.url.pathname)) {
    const next = event.url.pathname + event.url.search;
    throw redirect(303, `/sign-in?next=${encodeURIComponent(next)}`);
  }

  return resolve(event);
};

export const handleError: HandleServerError = ({ error, event, status, message }) => {
  // Phase 14 wires Sentry capture here. For now, structured stderr.
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
