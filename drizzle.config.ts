import { defineConfig } from 'drizzle-kit';

// Lumen Drizzle Kit config — see ADR-002 + ADR-003.
// DATABASE_URL is required for migrate / push / studio. generate works
// without a connection (schema-only) so initial scaffolding can proceed
// before any Neon project exists.
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/server/db/schema',
  out: './drizzle',
  casing: 'snake_case',
  strict: true,
  verbose: true,
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
