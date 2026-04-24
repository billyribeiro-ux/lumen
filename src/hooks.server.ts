// SvelteKit server hooks — auth session resolution + locals enrichment.
//
// `handle` runs on every request. We:
//   1. Resolve the Better Auth session from the cookie.
//   2. Hydrate event.locals.user / event.locals.session.
//   3. Hand off to the route handler.
//
// Per-request locals are typed in src/app.d.ts.

import type { Handle, HandleServerError } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });
  event.locals.session = session?.session ?? null;
  event.locals.user = session?.user ?? null;
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
