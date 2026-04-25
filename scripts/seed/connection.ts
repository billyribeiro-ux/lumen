// Standalone Drizzle connection for seed scripts.
//
// We can't import from $lib (SvelteKit alias) because seed scripts run
// outside the Vite/SvelteKit module graph via tsx. Instead, mirror the
// db factory shape with the same schema imports.

import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';
import * as schema from '../../src/lib/server/db/schema';

if (typeof WebSocket === 'undefined') {
  const { WebSocket: NodeWebSocket } = await import('ws');
  neonConfig.webSocketConstructor = NodeWebSocket as unknown as typeof WebSocket;
}

export function createSeedDb(databaseUrl: string) {
  return drizzle(neon(databaseUrl), { schema, casing: 'snake_case' });
}

export function createSeedDbTx(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzleWs(pool, { schema, casing: 'snake_case' });
  return { db, pool };
}

export type SeedDb = ReturnType<typeof createSeedDb>;
export { schema };
