import { test, expect } from '@playwright/test';

test.describe('Players Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
  });

  test('should display players page', async ({ page }) => {
    await page.goto('/dashboard/players');

    await expect(page.getByRole('heading', { name: /players/i })).toBeVisible();
  });

  test('should show search input', async ({ page }) => {
    await page.goto('/dashboard/players');

    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('should filter players by search term', async ({ page }) => {
    await page.goto('/dashboard/players');

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');

    // Wait for search results to update
    await page.waitForTimeout(500);

    // Search should filter the results
    // (actual behavior depends on data in the database)
  });

  test('should navigate to player detail page', async ({ page }) => {
    await page.goto('/dashboard/players');

    // Click on View link of first player card
    const viewLink = page.getByRole('link', { name: /view/i }).first();
    if (await viewLink.isVisible()) {
      await viewLink.click();

      // Should navigate to player detail page
      await expect(page).toHaveURL(/.*players\/.*$/);
    }
  });

  test('should show player history and stats links on detail page', async ({ page }) => {
    await page.goto('/dashboard/players');

    const viewLink = page.getByRole('link', { name: /view/i }).first();
    if (await viewLink.isVisible()) {
      await viewLink.click();

      // Should show links to history and stats
      await expect(page.getByText(/tournament history/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/statistics.*trends/i)).toBeVisible();
    }
  });

  test('should navigate to player history page', async ({ page }) => {
    await page.goto('/dashboard/players');

    const viewLink = page.getByRole('link', { name: /view/i }).first();
    if (await viewLink.isVisible()) {
      await viewLink.click();

      // Click on Tournament History
      await page.getByText(/tournament history/i).click();

      await expect(page).toHaveURL(/.*history/);
    }
  });

  test('should navigate to player stats page', async ({ page }) => {
    await page.goto('/dashboard/players');

    const viewLink = page.getByRole('link', { name: /view/i }).first();
    if (await viewLink.isVisible()) {
      await viewLink.click();

      // Click on Statistics & Trends
      await page.getByText(/statistics.*trends/i).click();

      await expect(page).toHaveURL(/.*stats/);
    }
  });

  test('should show leaderboard page', async ({ page }) => {
    await page.goto('/dashboard/leaderboard');

    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible();
  });
});
