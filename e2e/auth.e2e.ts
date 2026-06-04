import { expect, test } from '@playwright/test';

// Page-level coverage for the public auth surface. These exercise the live SSR
// path — the session hook, the route guard, and the security-header hook — and
// stay green without a database: the session hook now degrades to an anonymous
// request when session resolution fails (see src/hooks.server.ts), and auth no
// longer refuses to boot when OAuth secrets are absent (see src/lib/server/auth.ts).

test.describe('public auth surface', () => {
  test('sign-in page renders for anonymous visitors', async ({ page }) => {
    await page.goto('/sign-in');

    await expect(page).toHaveTitle(/Sign in — Lumen/);
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/sign-up',
    );
  });

  test('protected route redirects anonymous visitors to sign-in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/sign-in\?next=%2F$/);
  });

  test('responses carry the hardened security headers', async ({ request }) => {
    const response = await request.get('/sign-in');
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
