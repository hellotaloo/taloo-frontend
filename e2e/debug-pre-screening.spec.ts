import { test, expect } from '@playwright/test';

/**
 * Debug test to see what's on the pre-screening page
 */

test('debug: check pre-screening page loads', async ({ page }) => {
  // Navigate to pre-screening
  await page.goto('http://localhost:3000/pre-screening');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot so we can see what's there
  await page.screenshot({ path: 'debug-pre-screening.png', fullPage: true });

  // Just verify the page loaded
  await expect(page).toHaveURL(/.*pre-screening/);

  console.log('Page title:', await page.title());

  // Check if there are any links on the page
  const links = await page.locator('a').count();
  console.log('Number of links found:', links);

  // Check if there are any buttons
  const buttons = await page.locator('button').count();
  console.log('Number of buttons found:', buttons);
});

test('debug: list all visible text', async ({ page }) => {
  await page.goto('http://localhost:3000/pre-screening');
  await page.waitForLoadState('networkidle');

  // Get all text content
  const textContent = await page.textContent('body');
  console.log('Page contains text:', textContent?.substring(0, 500));
});
