import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('auth page loads with sign-in form', async ({ page }) => {
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('toggle to sign-up shows create account form', async ({ page }) => {
    await page.getByText("Don't have an account?").click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('toggle back to sign-in from sign-up', async ({ page }) => {
    await page.getByText("Don't have an account?").click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await page.getByText('Already have an account?').click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('sign-in with invalid credentials shows error', async ({ page }) => {
    await page.getByPlaceholder('Email').fill('notreal@example.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Sonner toast or inline error should appear
    await expect(
      page.locator('[data-sonner-toast]').or(page.getByText(/invalid|incorrect|credentials/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test('sign-up button is disabled until both legal checkboxes checked', async ({ page }) => {
    await page.getByText("Don't have an account?").click();
    const submitBtn = page.getByRole('button', { name: 'Create account' });
    // Button is disabled (agreedToTerms && agreedToPrivacy are both false)
    await expect(submitBtn).toBeDisabled();

    // Check terms only — still disabled
    await page.locator('#terms-signup').check();
    await expect(submitBtn).toBeDisabled();

    // Check both — now enabled
    await page.locator('#privacy-signup').check();
    await expect(submitBtn).toBeEnabled();
  });

  test('password strength indicator appears on sign-up when typing', async ({ page }) => {
    await page.getByText("Don't have an account?").click();
    await page.getByPlaceholder('Password').fill('weak');
    // Strength label appears after async validation resolves; use first() in case of duplicates
    await expect(page.getByText('Password Strength:').first()).toBeVisible({ timeout: 5000 });
  });

  test('forgot password link shows reset form', async ({ page }) => {
    await page.getByText('Forgot Password?').click();
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset Password' })).toBeVisible();
  });

  test('back link on reset form returns to sign-in', async ({ page }) => {
    await page.getByText('Forgot Password?').click();
    await page.getByText('Already have an account?').click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('remember me checkbox is present on sign-in form', async ({ page }) => {
    await expect(page.locator('#remember-me')).toBeVisible();
    await page.locator('#remember-me').check();
    await expect(page.locator('#remember-me')).toBeChecked();
  });

  test('Google and Microsoft OAuth buttons are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /microsoft/i })).toBeVisible();
  });
});
