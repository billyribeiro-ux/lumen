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
// Both read DATABASE_URL from $env/static/private so the same code
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

const createDb = () => drizzle(neon(DATABASE_URL), { schema, casing: 'snake_case' });

/** Resolved HTTP-backed Drizzle instance type. */
export type Database = ReturnType<typeof createDb>;

// Construct the client lazily on first use. Building it eagerly would call
// `neon(DATABASE_URL)` at module load, which throws when DATABASE_URL is absent
// or empty — e.g. SvelteKit's build-time `analyse` pass imports this module but
// never runs a query. Mirrors the lazy getAuth()/getStripe()/getAnthropic()
// pattern used elsewhere in src/lib/server.
let instance: Database | null = null;
const resolveDb = (): Database => {
  if (!instance) {
    instance = createDb();
  }
  return instance;
};

/**
 * Default Drizzle instance. HTTP transport. Edge-compatible.
 * Use for all reads and for single-statement writes.
 *
 * A lazy proxy: the underlying client is created on first property access,
 * not at import time, so importing this module never requires DATABASE_URL.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const target = resolveDb();
    const value = Reflect.get(target, prop);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

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

export { schema };
