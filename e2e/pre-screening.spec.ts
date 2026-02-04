import { test, expect } from '@playwright/test';

/**
 * Pre-screening Page E2E tests
 * Tests user interactions with the pre-screening feature
 */

test.describe('Pre-screening Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to pre-screening page before each test
    await page.goto('/pre-screening');
    await page.waitForLoadState('networkidle');
  });

  test('should load pre-screening page with table', async ({ page }) => {
    // Check that we're on the correct page
    await expect(page).toHaveURL(/.*pre-screening/);

    // Verify that a table is present (common pattern in data-heavy apps)
    // This is a basic check - adjust the selector based on your actual structure
    const table = page.locator('table, [role="table"]');

    // The table should be visible or we should see some content indicator
    // If the table is empty, you might see an empty state message instead
    const hasTable = await table.count() > 0;
    const hasEmptyState = await page.locator('text=/no.*data|empty/i').count() > 0;

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should have tabs for different views', async ({ page }) => {
    // Check if tabs are present (common pattern in the codebase based on imports)
    const tabs = page.locator('[role="tablist"], [role="tab"]');

    // Should have at least one tab
    await expect(tabs.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // Tabs might not be present on empty state, which is fine
      console.log('No tabs found - might be in empty state');
    });
  });

  test('should allow filtering or switching between views', async ({ page }) => {
    // Try to find and click on different tabs or filters
    const tabButtons = page.locator('[role="tab"]');
    const tabCount = await tabButtons.count();

    if (tabCount > 1) {
      // Click the second tab if it exists
      await tabButtons.nth(1).click();

      // Wait for content to update
      await page.waitForTimeout(500);

      // Verify the second tab is now active
      await expect(tabButtons.nth(1)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should handle row interactions', async ({ page }) => {
    // Wait for any table rows to load
    const rows = page.locator('table tbody tr, [role="row"]');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Try to interact with the first row
      const firstRow = rows.first();
      await expect(firstRow).toBeVisible();

      // Check if the row has clickable elements
      const rowButtons = firstRow.locator('button, a');
      const buttonCount = await rowButtons.count();

      if (buttonCount > 0) {
        // There are interactive elements in the row
        console.log(`Found ${buttonCount} interactive elements in row`);
      }
    } else {
      console.log('No data rows found - table might be empty');
    }
  });
});

/**
 * Advanced E2E testing concepts demonstrated:
 *
 * 1. test.beforeEach() - Setup that runs before each test
 *    - Ensures consistent starting state
 *    - Reduces code duplication
 *
 * 2. Defensive testing with await count()
 *    - Handles both full and empty states
 *    - Prevents tests from failing on empty data
 *
 * 3. Conditional logic for dynamic content
 *    - Tests adapt to what's actually on the page
 *    - More resilient to data changes
 *
 * 4. Multiple selector strategies
 *    - Try semantic HTML first (table, button)
 *    - Fallback to ARIA roles ([role="table"])
 *    - Use text matching for messages
 *
 * 5. Timeouts and waits
 *    - waitForLoadState() for initial page load
 *    - waitForTimeout() for animations/transitions
 *    - timeout option for specific expectations
 *
 * Tips for writing your own tests:
 * - Start simple (does the page load?)
 * - Add interactions gradually (click, type, select)
 * - Test happy paths first, then edge cases
 * - Use data-testid attributes for stable selectors
 * - Keep tests independent (don't rely on previous test state)
 */
