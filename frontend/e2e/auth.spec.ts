import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Note: This test requires a valid test user in the database
    // In CI, this should be set up via seed data
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login|sign in/i }).click();

    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });

    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });
});
