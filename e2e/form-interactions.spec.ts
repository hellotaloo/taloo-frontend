import { test, expect } from '@playwright/test';

/**
 * Form Interaction E2E tests
 * Demonstrates how to test forms, inputs, and user interactions
 */

test.describe('Form Interactions', () => {
  test('should fill out a text input', async ({ page }) => {
    await page.goto('/pre-screening');

    // Example: Find an input field (adjust selector to match your forms)
    const searchInput = page.locator('input[type="search"], input[type="text"]').first();

    // Check if the input exists
    const inputExists = await searchInput.count() > 0;

    if (inputExists) {
      // Fill in the input
      await searchInput.fill('Test search query');

      // Verify the value was set
      await expect(searchInput).toHaveValue('Test search query');

      // Clear the input
      await searchInput.clear();
      await expect(searchInput).toHaveValue('');
    }
  });

  test('should interact with buttons', async ({ page }) => {
    await page.goto('/pre-screening');

    // Find a button (adjust text to match your actual buttons)
    const button = page.locator('button').first();

    if (await button.count() > 0) {
      // Check that button is visible and enabled
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();

      // You can click the button if needed (be careful with actions that create data)
      // await button.click();
    }
  });

  test('should interact with switches/toggles', async ({ page }) => {
    await page.goto('/pre-screening');

    // Find a switch element (based on the Switch component used in the codebase)
    const switches = page.locator('[role="switch"]');
    const switchCount = await switches.count();

    if (switchCount > 0) {
      const firstSwitch = switches.first();

      // Get initial state
      const initialState = await firstSwitch.getAttribute('aria-checked');

      // Toggle the switch
      await firstSwitch.click();

      // Wait for state change
      await page.waitForTimeout(300);

      // Verify state changed
      const newState = await firstSwitch.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    }
  });

  test('should interact with dropdown menus', async ({ page }) => {
    await page.goto('/pre-screening');

    // Look for dropdown triggers (adjust based on your UI)
    const dropdownTriggers = page.locator('[role="combobox"], button[aria-haspopup="menu"]');
    const dropdownCount = await dropdownTriggers.count();

    if (dropdownCount > 0) {
      const firstDropdown = dropdownTriggers.first();

      // Open the dropdown
      await firstDropdown.click();

      // Wait for dropdown menu to appear
      await page.waitForTimeout(300);

      // Look for menu items
      const menuItems = page.locator('[role="menuitem"], [role="option"]');
      const itemCount = await menuItems.count();

      if (itemCount > 0) {
        // A dropdown menu opened successfully
        await expect(menuItems.first()).toBeVisible();

        // Close it by clicking elsewhere or pressing Escape
        await page.keyboard.press('Escape');
      }
    }
  });

  test('should interact with dialogs/modals', async ({ page }) => {
    await page.goto('/pre-screening');

    // Look for buttons that might open dialogs
    const dialogTriggers = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")');
    const triggerCount = await dialogTriggers.count();

    if (triggerCount > 0) {
      // Click the first trigger
      await dialogTriggers.first().click();

      // Wait for dialog to appear
      await page.waitForTimeout(300);

      // Look for dialog/modal
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]');

      if (await dialog.count() > 0) {
        // Dialog opened successfully
        await expect(dialog).toBeVisible();

        // Look for close button or cancel button
        const closeButton = dialog.locator('button:has-text("Cancel"), button:has-text("Close"), button[aria-label="Close"]');

        if (await closeButton.count() > 0) {
          await closeButton.first().click();

          // Verify dialog closed
          await expect(dialog).not.toBeVisible();
        } else {
          // Close with Escape key
          await page.keyboard.press('Escape');
        }
      }
    }
  });
});

/**
 * Form Testing Patterns Explained:
 *
 * 1. Text Inputs:
 *    - Use .fill() to type text
 *    - Use .clear() to clear text
 *    - Use .type() for character-by-character typing (useful for testing autocomplete)
 *
 * 2. Buttons:
 *    - Check visibility and enabled state before clicking
 *    - Use .click() for clicking
 *    - Consider testing loading states and disabled states
 *
 * 3. Toggles/Switches:
 *    - Check aria-checked attribute for state
 *    - Click to toggle
 *    - Verify state change
 *
 * 4. Dropdowns:
 *    - Click trigger to open
 *    - Wait for menu items to appear
 *    - Select an item or close with Escape
 *
 * 5. Dialogs/Modals:
 *    - Find and click trigger button
 *    - Wait for dialog to appear
 *    - Interact with dialog content
 *    - Close dialog and verify it's gone
 *
 * Best Practices:
 * - Always wait for elements to be visible before interacting
 * - Use defensive checks (count > 0) when elements might not exist
 * - Test both success and cancel flows
 * - Consider adding data-testid attributes to make selectors more stable
 * - Don't test implementation details, test user behavior
 *
 * Example with data-testid:
 * <button data-testid="create-interview-btn">Create Interview</button>
 *
 * Then in your test:
 * await page.locator('[data-testid="create-interview-btn"]').click();
 */
