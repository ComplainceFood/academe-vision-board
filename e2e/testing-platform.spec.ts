import { test, expect } from '@playwright/test';

const HAS_TEST_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

async function signIn(page: any) {
  await page.goto('/auth');
  await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(/^(?!.*\/auth).*$/, { timeout: 15000 });
}

test.describe('Testing Platform', () => {
  test.skip(!HAS_TEST_CREDS, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated tests');

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto('/testing');
  });

  test('testing platform header is visible', async ({ page }) => {
    await expect(page.getByText(/testing platform/i)).toBeVisible();
  });

  test('four tabs are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /test projects/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /system health/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /security scan/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /seed test cases/i })).toBeVisible();
  });

  test('test projects tab is default active', async ({ page }) => {
    // The Test Projects tab is default; dashboard or empty state should render
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

  test('can click into a seeded project', async ({ page }) => {
    // If projects exist from seeding, clicking one opens TestProjectView
    const projectCard = page.locator('[data-testid="project-card"]').or(
      page.getByRole('button', { name: /authentication|dashboard|settings/i }).first()
    );
    const hasProjects = await projectCard.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasProjects) {
      await projectCard.click();
      await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
    } else {
      test.info().annotations.push({ type: 'info', description: 'No seeded projects found — skipping drill-down check' });
    }
  });
});
