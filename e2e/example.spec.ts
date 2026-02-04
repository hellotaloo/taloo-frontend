import { test, expect } from '@playwright/test';

/**
 * Example E2E test file
 * This demonstrates the basic structure of a Playwright test
 */

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the page loaded (you can adapt this to your actual homepage)
    await expect(page).toHaveTitle(/Taloo/i);
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Example: Check if specific navigation elements exist
    // Adapt these selectors to match your actual navigation structure
    const navLinks = page.locator('nav a, [role="navigation"] a');
    await expect(navLinks.first()).toBeVisible();
  });
});

/**
 * Testing best practices demonstrated:
 *
 * 1. Use test.describe() to group related tests
 * 2. Use descriptive test names that explain what is being tested
 * 3. Start with page.goto() to navigate
 * 4. Use await for all async operations
 * 5. Use expect() for assertions
 */
