import { test, expect } from '@playwright/test';

/**
 * Recorded Pre-screening Workflow
 * This test was generated using Playwright Codegen
 * You can modify it to make it more maintainable
 */

test('pre-screening complete workflow', async ({ page }) => {
  // Navigate directly to pre-screening page
  await page.goto('http://localhost:3000/pre-screening');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Click on first pre-screening item
  await page.getByRole('link', { name: 'Pre-screenen' }).first().click();

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Fill in qualification questions
  await page.getByRole('textbox', { name: 'Geef feedback of vraag' }).click();
  await page.getByRole('textbox', { name: 'Geef feedback of vraag' }).fill('Maak de kwalificatievragen korter');
  await page.getByRole('textbox', { name: 'Voeg kwalificerende vraag toe' }).click();
  await page.getByRole('textbox', { name: 'Voeg kwalificerende vraag toe' }).fill('Hoe ga je om met stress?');
  await page.getByRole('button', { name: 'next', exact: true }).click();

  // Fill in candidate description
  await page.getByRole('textbox', { name: 'Beschrijf het ideale antwoord' }).fill('De kandidaat blijft altijd rustig');
  await page.getByRole('button', { name: 'add' }).click();

  // Select ideal answer options
  await page.getByRole('button', { name: 'Ideaal antwoord' }).nth(3).click();
  await page.getByRole('button', { name: 'Ideaal antwoord' }).nth(3).click();

  // Trigger simulation
  await page.getByRole('button', { name: 'Simulatie' }).click();

  // Set auto-answer
  await page.getByRole('button', { name: 'Auto-antwoord' }).click();

  // Publish
  await page.getByRole('button', { name: 'Publiceren', exact: true }).click();
  await page.getByRole('button', { name: 'Publiceren' }).click();

  // Navigate to questions
  await page.getByRole('button', { name: 'Vragen' }).click();

  // Final simulation
  await page.getByRole('button', { name: 'Simulatie' }).click();
});
