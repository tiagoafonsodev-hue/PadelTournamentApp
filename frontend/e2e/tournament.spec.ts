import { test, expect } from '@playwright/test';

test.describe('Tournament Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
  });

  test('should display tournaments page', async ({ page }) => {
    await page.goto('/dashboard/tournaments');

    await expect(page.getByRole('heading', { name: /tournaments/i })).toBeVisible();
  });

  test('should navigate to create tournament page', async ({ page }) => {
    await page.goto('/dashboard/tournaments');

    // Click on create tournament button
    const createButton = page.getByRole('link', { name: /create|new/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page).toHaveURL(/.*create/);
    }
  });

  test('should show tournament category selection in step 1', async ({ page }) => {
    await page.goto('/dashboard/tournaments/create');

    // Should show category selection
    await expect(page.getByText(/open 250/i)).toBeVisible();
    await expect(page.getByText(/open 500/i)).toBeVisible();
    await expect(page.getByText(/open 1000/i)).toBeVisible();
    await expect(page.getByText(/masters/i)).toBeVisible();
  });

  test('should show field count selector in step 2', async ({ page }) => {
    await page.goto('/dashboard/tournaments/create');

    // Select a category
    await page.getByText(/open 250/i).click();

    // Click Next
    await page.getByRole('button', { name: /next/i }).click();

    // Should show field count selector
    await expect(page.getByText(/number of fields/i)).toBeVisible();
  });

  test('should navigate through tournament creation steps', async ({ page }) => {
    await page.goto('/dashboard/tournaments/create');

    // Step 1: Select category
    await page.getByText(/open 250/i).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Basic info
    await expect(page.getByText(/tournament date/i)).toBeVisible();

    // Fill in date
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2025-03-01');

    // Select tournament type
    await page.getByText(/round robin/i).click();

    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Create teams
    await expect(page.getByText(/create teams/i)).toBeVisible();
  });

  test('should view tournament details', async ({ page }) => {
    await page.goto('/dashboard/tournaments');

    // Click on a tournament card if available
    const tournamentCard = page.locator('[class*="card"]').first();
    if (await tournamentCard.isVisible()) {
      await tournamentCard.click();

      // Should show tournament details
      await expect(page.getByText(/match/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
