// Lumen observability — Sentry + structured logging.
//
// Initializes the Sentry client when SENTRY_DSN is configured;
// otherwise the surface no-ops so dev runs without remote logging.

import * as Sentry from '@sentry/sveltekit';

const dsn = process.env['PUBLIC_SENTRY_DSN'] ?? process.env['SENTRY_DSN'];
const environment = process.env['NODE_ENV'] ?? 'development';
const release = process.env['VERCEL_GIT_COMMIT_SHA'] ?? process.env['LUMEN_RELEASE'] ?? 'dev';

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Strip server-side env values that may leak into stack traces.
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, string>;
        delete headers['cookie'];
        delete headers['authorization'];
      }
      return event;
    },
  });
}

export { Sentry };

export const isObservabilityConfigured = (): boolean => Boolean(dsn);
