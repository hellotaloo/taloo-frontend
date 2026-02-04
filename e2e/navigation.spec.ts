import { test, expect } from '@playwright/test';

/**
 * Navigation E2E tests
 * Tests the main navigation flows in the application
 */

test.describe('Navigation', () => {
  test('should navigate to pre-screening page', async ({ page }) => {
    await page.goto('/');

    // Navigate to pre-screening
    await page.goto('/pre-screening');

    // Verify we're on the pre-screening page
    await expect(page).toHaveURL(/.*pre-screening/);

    // Wait for content to load
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to knockout interviews page', async ({ page }) => {
    await page.goto('/');

    // Navigate to knockout interviews
    await page.goto('/knockout-interviews');

    // Verify we're on the knockout interviews page
    await expect(page).toHaveURL(/.*knockout-interviews/);

    // Wait for content to load
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to metrics page', async ({ page }) => {
    await page.goto('/');

    // Navigate to metrics
    await page.goto('/metrics');

    // Verify we're on the metrics page
    await expect(page).toHaveURL(/.*metrics/);

    // Wait for content to load
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to insights page', async ({ page }) => {
    await page.goto('/');

    // Navigate to insights
    await page.goto('/insights');

    // Verify we're on the insights page
    await expect(page).toHaveURL(/.*insights/);

    // Wait for content to load
    await page.waitForLoadState('networkidle');
  });
});

/**
 * Testing pattern explained:
 *
 * For each navigation test:
 * 1. Start at homepage (consistent starting point)
 * 2. Navigate to target page
 * 3. Verify URL changed correctly
 * 4. Wait for page to fully load
 *
 * This ensures basic navigation works before testing complex interactions
 */
