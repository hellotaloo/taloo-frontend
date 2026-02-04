import { test, expect } from '@playwright/test';

/**
 * Pre-screening tests using data-testid attributes
 * These tests are much more reliable than text-based selectors
 */

test.describe('Pre-screening Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/pre-screening');
    await page.waitForLoadState('networkidle');
  });

  test('should load pre-screening page', async ({ page }) => {
    await expect(page).toHaveURL(/.*pre-screening/);
  });

  test('should have tabs for different vacancy states', async ({ page }) => {
    // Check that all three tabs exist using testids
    await expect(page.locator('[data-testid="tab-new-vacancies"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-generated-vacancies"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-archived-vacancies"]')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Click on "Gegenereerd" tab
    await page.locator('[data-testid="tab-generated-vacancies"]').click();

    // Verify the tab is active
    await expect(page.locator('[data-testid="tab-generated-vacancies"]')).toHaveAttribute('data-state', 'active');

    // Click on "Gearchiveerd" tab
    await page.locator('[data-testid="tab-archived-vacancies"]').click();

    // Verify the tab is active
    await expect(page.locator('[data-testid="tab-archived-vacancies"]')).toHaveAttribute('data-state', 'active');
  });

  test('should click generate button on first pending vacancy (if exists)', async ({ page }) => {
    // Make sure we're on the "Nieuw" tab
    await page.locator('[data-testid="tab-new-vacancies"]').click();

    // Check if there are any pending vacancies
    const generateButtons = page.locator('[data-testid^="generate-prescreening-btn-"]');
    const count = await generateButtons.count();

    if (count > 0) {
      // Click the first "Pre-screening genereren" button
      await generateButtons.first().click();

      // Wait for navigation to edit page
      await expect(page).toHaveURL(/.*pre-screening\/edit\/.*/);
    } else {
      console.log('No pending vacancies found to test');
    }
  });

  test('should click on generated vacancy row (if exists)', async ({ page }) => {
    // Switch to "Gegenereerd" tab
    await page.locator('[data-testid="tab-generated-vacancies"]').click();

    // Look for generated vacancy rows
    const vacancyRows = page.locator('[data-testid^="generated-vacancy-row-"]');
    const count = await vacancyRows.count();

    if (count > 0) {
      // Click on the first row
      await vacancyRows.first().click();

      // Should navigate to view page
      await expect(page).toHaveURL(/.*pre-screening\/view\/.*/);
    } else {
      console.log('No generated vacancies found to test');
    }
  });
});

/**
 * Benefits of using data-testid:
 *
 * 1. ✅ Stable - Won't break when text changes (e.g., "Pre-screenen" → "Bewerken")
 * 2. ✅ Clear intent - Shows exactly what you're testing
 * 3. ✅ Language independent - Works regardless of UI language
 * 4. ✅ Unique - Each element has a unique identifier
 * 5. ✅ Easy to find - Just search for data-testid in your code
 *
 * Usage patterns demonstrated:
 *
 * - Static testids: data-testid="tab-new-vacancies"
 *   Use: page.locator('[data-testid="tab-new-vacancies"]')
 *
 * - Dynamic testids with IDs: data-testid="generate-prescreening-btn-123"
 *   Use first match: page.locator('[data-testid^="generate-prescreening-btn-"]').first()
 *   Use specific ID: page.locator('[data-testid="generate-prescreening-btn-123"]')
 *
 * - Count elements: await page.locator('[data-testid^="prefix-"]').count()
 *
 * - Get all: await page.locator('[data-testid^="prefix-"]').all()
 */
