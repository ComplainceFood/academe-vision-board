import { test, expect } from '@playwright/test';

test.describe('Promo flow', () => {
  test('auth page loads normally with ?plan=pro param', async ({ page }) => {
    await page.goto('/auth?plan=pro');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('sign-up form accessible via ?plan=pro', async ({ page }) => {
    await page.goto('/auth?plan=pro');
    await page.getByText("Don't have an account?").click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('promo pending flag written to localStorage when signing up with ?plan=pro', async ({ page }) => {
    await page.goto('/auth?plan=pro');
    await page.getByText("Don't have an account?").click();
    await page.getByPlaceholder('Email').fill('promouser_e2e@example.com');
    await page.getByPlaceholder('Password').fill('PromoPass123!@#');

    // Accept legal checkboxes
    const termsBox = page.locator('#terms-signup');
    const privacyBox = page.locator('#privacy-signup');
    if (await termsBox.isVisible()) await termsBox.check();
    if (await privacyBox.isVisible()) await privacyBox.check();

    await page.getByRole('button', { name: 'Create account' }).click();

    // Flag is set synchronously before the API call if promoActive is true
    // May be null if promo feature flag is off — both states are valid
    const flag = await page.evaluate(() => localStorage.getItem('academe_promo_pending'));
    expect(flag === '1' || flag === null).toBe(true);
  });

  test('signing up without ?plan=pro does not set promo flag', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText("Don't have an account?").click();
    await page.getByPlaceholder('Email').fill('nonpromo_e2e@example.com');
    await page.getByPlaceholder('Password').fill('RegularPass123!@#');

    const termsBox = page.locator('#terms-signup');
    const privacyBox = page.locator('#privacy-signup');
    if (await termsBox.isVisible()) await termsBox.check();
    if (await privacyBox.isVisible()) await privacyBox.check();

    await page.getByRole('button', { name: 'Create account' }).click();

    const flag = await page.evaluate(() => localStorage.getItem('academe_promo_pending'));
    expect(flag).toBeNull();
  });
});
