// Production safety guard — refuse to run seed/wipe/reset against
// anything that looks like production.
//
// Three signals must agree before we proceed:
//   1. NODE_ENV is not 'production'
//   2. ALLOW_DESTRUCTIVE_DB_OPS=true is set on the environment
//   3. DATABASE_URL hostname does not match a known production host pattern
//
// Any one failure aborts. The double-confirmation is intentional —
// seed scripts have run against production at every company that has
// shipped seed scripts. We are not joining that list.

const PRODUCTION_HOST_HINTS = [
  // Lumen production projects on Neon (real prod connections will be tagged
  // with these substrings; seed should never be run against them).
  'lumen-prod',
  'production',
  'prod-pooler',
];

export function assertNotProduction(
  databaseUrl: string | undefined,
): asserts databaseUrl is string {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Refusing to run seed/wipe/reset.');
  }

  if (process.env['NODE_ENV'] === 'production') {
    throw new Error(
      'NODE_ENV=production. Refusing to run seed/wipe/reset. ' +
        'If you genuinely need to seed a prod-shaped DB, use a dedicated test branch.',
    );
  }

  if (process.env['ALLOW_DESTRUCTIVE_DB_OPS'] !== 'true') {
    throw new Error(
      'ALLOW_DESTRUCTIVE_DB_OPS is not set to "true". ' +
        'This is a guardrail to prevent accidental data loss. ' +
        'Run with: ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:seed',
    );
  }

  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    throw new Error(`DATABASE_URL is not a valid URL. Aborting.`);
  }

  for (const hint of PRODUCTION_HOST_HINTS) {
    if (host.includes(hint)) {
      throw new Error(
        `DATABASE_URL hostname "${host}" matches a production hint pattern (${hint}). ` +
          'Refusing to run. Override only by editing PRODUCTION_HOST_HINTS in scripts/seed/guard.ts.',
      );
    }
  }
}
