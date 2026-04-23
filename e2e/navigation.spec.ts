import { test, expect } from '@playwright/test';

async function signIn(page: any, email: string, password: string) {
  await page.goto('/auth');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/^(?!.*\/auth).*$/, { timeout: 15000 });
}

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
    // App loads — access control is enforced inside the component, not via redirect
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

  test('can navigate to testing page', async ({ page }) => {
    await page.goto('/testing');
    await expect(page).toHaveURL(/\/testing/);
    await expect(page.getByText('Testing Platform')).toBeVisible();
  });

  test('dark mode toggle switches theme', async ({ page }) => {
    const html = page.locator('html');
    const before = await html.getAttribute('class');
    // Moon or Sun icon button in header
    await page.locator('header').getByRole('button').filter({ has: page.locator('svg') }).nth(1).click();
    const after = await html.getAttribute('class');
    expect(after).not.toBe(before);
  });

  test('logout navigates to /auth', async ({ page }) => {
    // Last icon button in header is logout
    await page.locator('header').getByRole('button').last().click();
    await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
  });
});
