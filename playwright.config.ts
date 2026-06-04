import { defineConfig } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  webServer: {
    command: 'pnpm build && pnpm preview',
    port: PORT,
    reuseExistingServer: !process.env['CI'],
  },
  use: { baseURL: `http://localhost:${PORT}` },
  testMatch: '**/*.e2e.{ts,js}',
});
