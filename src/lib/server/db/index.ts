// Drizzle instance factory — ADR-002 + ADR-003.
//
// Two entry points:
//   - `db` — the HTTP-backed default. Edge-compatible, no persistent
//     connection, multi-statement transactions NOT supported.
//   - `dbTransact(fn)` — opens a WebSocket connection, starts a
//     transaction, runs the callback, commits. Use only for
//     code paths that need multi-statement transactional writes
//     (subscription state transitions, audit-log paired writes).
//
// Both read DATABASE_URL from $env/dynamic/private so the same code
// path works across dev / preview / staging / production.

import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';
import { DATABASE_URL } from '$env/static/private';
import * as schema from './schema';

// Neon serverless driver WebSocket config — required when running in
// a non-edge Node environment (Vercel serverless functions use
// `ws` under the hood; Neon's driver auto-detects). No-op in edge.
if (typeof WebSocket === 'undefined') {
  // Lazy import keeps edge bundles clean.
  const { WebSocket: NodeWebSocket } = await import('ws');
  neonConfig.webSocketConstructor = NodeWebSocket as unknown as typeof WebSocket;
}

/**
 * Default Drizzle instance. HTTP transport. Edge-compatible.
 * Use for all reads and for single-statement writes.
 */
export const db = drizzle(neon(DATABASE_URL), { schema, casing: 'snake_case' });

/**
 * Run `fn` inside a WebSocket-backed transaction. The callback receives
 * a Drizzle transaction handle with the full schema bound.
 *
 * Call sites should be rare — prefer `db` unless multi-statement
 * atomicity is required. Webhook handlers, subscription state changes,
 * and audit-paired writes are the canonical users.
 */
export async function dbTransact<T>(
  fn: (tx: Parameters<Parameters<ReturnType<typeof drizzleWs>['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const txDb = drizzleWs(pool, { schema, casing: 'snake_case' });
  try {
    return await txDb.transaction(fn);
  } finally {
    await pool.end();
  }
}

export type Database = typeof db;
export { schema };
