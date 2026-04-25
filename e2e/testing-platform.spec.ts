import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// These tests require an admin account — set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD
const HAS_ADMIN_CREDS = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);

test.describe('Testing Platform', () => {
  test.skip(!HAS_ADMIN_CREDS, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (admin account) to run these tests');

  test.beforeEach(async ({ page }) => {
    await signIn(page, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!);
    await page.goto('/testing');
  });

  test('testing platform header is visible', async ({ page }) => {
    await expect(page.getByText('Testing Platform')).toBeVisible();
  });

  test('four tabs are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /test projects/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /system health/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /security scan/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /seed test cases/i })).toBeVisible();
  });

  test('test projects tab is default active', async ({ page }) => {
    await expect(page.getByText(/test projects|no projects/i)).toBeVisible();
  });

  test('system health tab loads runner', async ({ page }) => {
    await page.getByRole('button', { name: /system health/i }).click();
    await expect(page.getByText(/run|health|check/i).first()).toBeVisible();
  });

  test('security scan tab loads scanner', async ({ page }) => {
    await page.getByRole('button', { name: /security scan/i }).click();
    await expect(page.getByText(/scan|security|vulnerab/i).first()).toBeVisible();
  });

  test('seed test cases tab loads seeder', async ({ page }) => {
    await page.getByRole('button', { name: /seed test cases/i }).click();
    await expect(page.getByText(/seed|project/i).first()).toBeVisible();
  });
});
