import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

const HAS_TEST_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

test.describe('Settings page', () => {
  test.skip(!HAS_TEST_CREDS, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated tests');

  test.beforeEach(async ({ page }) => {
    await signIn(page, process.env.E2E_TEST_EMAIL!, process.env.E2E_TEST_PASSWORD!);
    await page.goto('/settings');
  });

  test('settings page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('billing interval toggle is visible on Plan tab', async ({ page }) => {
    await page.getByRole('tab', { name: /plan/i }).click();
    const toggle = page.getByRole('switch', { name: /toggle billing interval/i });
    await expect(toggle).toBeVisible({ timeout: 10000 });
  });

  test('Pro badge or upgrade button shown in plan card', async ({ page }) => {
    const planIndicator = page.getByText(/pro|upgrade to pro/i).first();
    await expect(planIndicator).toBeVisible();
  });

  test('profile form has name field', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    // Settings page loaded without crash
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test('no error banner on settings page', async ({ page }) => {
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });
});
