import { expect, test } from '@playwright/test';

// First end-to-end coverage: a production-server smoke test.
//
// The Playwright webServer runs `pnpm build && pnpm preview`, so these assertions
// prove the production bundle builds and the preview server boots and serves its
// static assets. They intentionally avoid SSR routes: every SSR request runs the
// `session` hook, which constructs Better Auth and opens a database connection —
// so page-level flows require the e2e job's preview database (and, in production
// mode, OAuth provider secrets). Those land once the environment is provisioned.

test.describe('production server smoke', () => {
  test('serves the favicon as SVG', async ({ request }) => {
    const response = await request.get('/favicon.svg');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/svg+xml');
  });

  test('serves robots.txt with crawl rules', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    expect(await response.text()).toContain('User-agent: *');
  });
});
