// Reset = wipe + seed.
//
// Usage:
//   ALLOW_DESTRUCTIVE_DB_OPS=true pnpm db:reset
//
// Convenience wrapper for "I want a clean dev DB now."

import { spawnSync } from 'node:child_process';

function runScript(script: string) {
  const result = spawnSync('pnpm', ['exec', 'tsx', script], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`[reset] ${script} failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.info('[reset] Wiping...');
runScript('scripts/seed/wipe.ts');

console.info('[reset] Seeding...');
runScript('scripts/seed/index.ts');

console.info('[reset] Done.');
