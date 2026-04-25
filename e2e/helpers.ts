import { Page } from '@playwright/test';

export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/^(?!.*\/auth).*$/, { timeout: 15000 });
  await dismissOnboarding(page);
}

export async function dismissOnboarding(page: Page) {
  // Try multiple times — modal may animate in after a short delay
  for (let i = 0; i < 3; i++) {
    try {
      const skip = page.getByText('Skip tour', { exact: true });
      await skip.waitFor({ state: 'visible', timeout: 2000 });
      await skip.click({ force: true });
      await skip.waitFor({ state: 'hidden', timeout: 2000 });
      return;
    } catch {
      // Not visible yet or already gone
    }
  }
}
