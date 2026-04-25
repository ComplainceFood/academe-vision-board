import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

const HAS_TEST_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe('Navigation guards (unauthenticated)', () => {
  test('/settings redirects to /auth', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/auth/, { timeout: 8000 });
  });

  test('/testing redirects to /auth', async ({ page }) => {
    await page.goto('/testing');
    await expect(page).toHaveURL(/\/auth/, { timeout: 8000 });
  });

  test('/admin page is accessible (role-gated inside app, not at router level)', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
  });
});

test.describe('Navigation (authenticated)', () => {
  test.skip(!HAS_TEST_CREDS, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated tests');

  test.beforeEach(async ({ page }) => {
    await signIn(page, process.env.E2E_TEST_EMAIL!, process.env.E2E_TEST_PASSWORD!);
  });

  test('dashboard loads after sign-in', async ({ page }) => {
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('can navigate to settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);
  });

  test('testing page is gated — free user is redirected away', async ({ page }) => {
    await page.goto('/testing');
    // Free users get redirected away from /testing
    await expect(page).not.toHaveURL(/\/testing/, { timeout: 8000 });
  });

  test('dark mode toggle switches theme', async ({ page }) => {
    // Add aria-label to the dark mode button via JS, then click it
    // The button is the 2nd-to-last icon button in the header (before logout)
    const html = page.locator('html');
    const before = await html.getAttribute('class');
    const headerBtns = page.locator('header button');
    const count = await headerBtns.count();
    // Dark mode button is second from last (last is logout)
    await headerBtns.nth(count - 2).click();
    const after = await html.getAttribute('class');
    expect(after).not.toBe(before);
  });

  test('logout navigates to /auth', async ({ page }) => {
    await page.locator('header').getByRole('button').last().click();
    await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
  });
});
