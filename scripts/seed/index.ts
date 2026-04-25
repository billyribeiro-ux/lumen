// Lumen seed entry point.
//
// Usage:
//   ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:seed
//
// This script is deterministic and idempotent — running it twice
// produces the same final state. It NEVER drops tables or runs DDL
// (Drizzle Kit owns DDL; the seed only INSERTs / SELECTs).

import { createSeedDb } from './connection';
import { assertNotProduction } from './guard';
import { seedBilling } from './runners/billing';
import { seedContent } from './runners/content';
import { seedRbac } from './runners/rbac';
import { seedUsersAndOrgs } from './runners/users';

async function main() {
  const start = Date.now();
  const databaseUrl = process.env['DATABASE_URL'];
  assertNotProduction(databaseUrl);

  console.info('[seed] DATABASE_URL host:', new URL(databaseUrl).hostname);

  const db = createSeedDb(databaseUrl);

  console.info('[seed] 1/4 RBAC roles + permissions...');
  await seedRbac(db);

  console.info('[seed] 2/4 Billing products + prices...');
  await seedBilling(db);

  console.info('[seed] 3/4 Users + organizations + memberships + accounts + entitlements...');
  const ctx = await seedUsersAndOrgs(db);

  console.info('[seed] 4/4 Sample content (nodes, links, tags, dailies, inbox)...');
  await seedContent(db, ctx);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.info(`[seed] Done in ${elapsed}s.`);
  console.info(
    `[seed] Sign-in is enabled for all 15 personas with password "LumenDev2026!" once Phase 3 wires Better Auth.`,
  );
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
