import { test, expect } from '@playwright/test';

/**
 * Pre-screening workflow with data existence check
 * This test handles both empty and populated states
 */

test('pre-screening workflow (if data exists)', async ({ page }) => {
  // Navigate to pre-screening page
  await page.goto('http://localhost:3000/pre-screening');
  await page.waitForLoadState('networkidle');

  // Check if there are any rows/items to interact with
  const rows = page.locator('table tbody tr, [role="row"]');
  const rowCount = await rows.count();

  if (rowCount === 0) {
    console.log('No data found on page - skipping workflow test');
    test.skip();
    return;
  }

  console.log(`Found ${rowCount} rows`);

  // Look for buttons in the first row
  const firstRow = rows.first();
  const buttons = firstRow.locator('button');
  const buttonCount = await buttons.count();

  console.log(`Found ${buttonCount} buttons in first row`);

  if (buttonCount > 0) {
    // Click the first button (might be edit, view, or generate)
    await buttons.first().click();

    // Wait for navigation or dialog
    await page.waitForTimeout(1000);

    // Continue with your workflow here...
  }
});

test('check what elements are actually on the page', async ({ page }) => {
  await page.goto('http://localhost:3000/pre-screening');
  await page.waitForLoadState('networkidle');

  // Take a screenshot for debugging
  await page.screenshot({ path: 'pre-screening-page.png', fullPage: true });

  // Log what we find
  const links = await page.locator('a').all();
  console.log('Links found:', links.length);

  const buttons = await page.locator('button').all();
  console.log('Buttons found:', buttons.length);

  // Log button text
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent();
    console.log(`Button ${i}: "${text}"`);
  }
});
