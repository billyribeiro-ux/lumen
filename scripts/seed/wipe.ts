// Wipe all rows from non-system tables. Schema (DDL) is preserved.
//
// Usage:
//   ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:wipe
//
// Safe to run before `pnpm db:seed` to start clean. Aborts on any
// production-leaning environment via the same guard as the seed.

import { sql } from 'drizzle-orm';
import { createSeedDbTx } from './connection';
import { assertNotProduction } from './guard';

// Tables in delete order — children first, parents last. Inverse of FK chain.
const TABLES_IN_DELETE_ORDER = [
  // Content M:N + satellites first
  'node_tags',
  'links',
  'node_content',
  'node_versions',
  'decisions',
  'snippets',
  'dailies',
  'publications',
  'inbox_items',
  // AI
  'ai_messages',
  'ai_conversations',
  // Tags after node_tags
  'tags',
  // Nodes after their satellites
  'nodes',
  // Billing satellites first, then anchors
  'invoices',
  'payment_methods',
  'subscriptions',
  'entitlements',
  'prices',
  'products',
  // RBAC
  'role_permissions',
  'permissions',
  'roles',
  // Audit + webhooks
  'audit_log',
  'webhook_events',
  // Org structure
  'memberships',
  'invitations',
  'organizations',
  // Auth (last — user references are everywhere)
  'sessions',
  'accounts',
  'verification',
  'users',
] as const;

async function main() {
  const start = Date.now();
  const databaseUrl = process.env['DATABASE_URL'];
  assertNotProduction(databaseUrl);

  console.info('[wipe] DATABASE_URL host:', new URL(databaseUrl).hostname);
  const { db, pool } = createSeedDbTx(databaseUrl);

  try {
    await db.transaction(async (tx) => {
      for (const table of TABLES_IN_DELETE_ORDER) {
        console.info(`[wipe] truncating ${table}...`);
        await tx.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
      }
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.info(`[wipe] Done in ${elapsed}s.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[wipe] Failed:', err);
  process.exit(1);
});
