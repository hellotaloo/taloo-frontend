# E2E Testing Guide

## What is E2E Testing?

**End-to-End (E2E) testing** simulates real user interactions with your application. Unlike unit tests that test individual functions in isolation, E2E tests:

- Run in a **real browser** (Chrome, Firefox, Safari)
- Test **complete user workflows** from start to finish
- Interact with your app **exactly like a real user** would (clicking, typing, navigating)
- Catch **integration issues** between frontend, backend, and APIs
- Verify the **entire user experience** works correctly

### Example: Testing a Pre-screening Workflow

```typescript
test('user creates a new interview', async ({ page }) => {
  // 1. Navigate to the page
  await page.goto('/pre-screening');

  // 2. Click the "Create New" button
  await page.click('button:has-text("Create New")');

  // 3. Fill out the form
  await page.fill('input[name="title"]', 'Software Engineer Interview');
  await page.fill('textarea[name="description"]', 'Technical screening');

  // 4. Submit the form
  await page.click('button[type="submit"]');

  // 5. Verify success
  await expect(page.locator('text=Interview created')).toBeVisible();
});
```

## Why Playwright?

This project uses **Playwright** because:

- ✅ **Official Next.js recommendation** - Best support for Next.js apps
- ✅ **Fast and reliable** - Tests run quickly and consistently
- ✅ **Multi-browser** - Test on Chrome, Firefox, and Safari automatically
- ✅ **Great TypeScript support** - Full type safety in tests
- ✅ **Excellent debugging tools** - UI mode, trace viewer, codegen
- ✅ **Auto-wait** - Automatically waits for elements to be ready

## Project Structure

```
taloo-frontend/
├── e2e/                          # All E2E tests go here
│   ├── example.spec.ts           # Basic example tests
│   ├── navigation.spec.ts        # Navigation tests
│   ├── pre-screening.spec.ts     # Pre-screening feature tests
│   └── form-interactions.spec.ts # Form interaction patterns
├── playwright.config.ts          # Playwright configuration
└── package.json                  # Test scripts
```

## Running Tests

### 1. Run all tests (headless)
```bash
npm run test:e2e
```
This runs all tests in headless mode (no browser window). Best for CI/CD.

### 2. Run tests with UI Mode (Recommended for development)
```bash
npm run test:e2e:ui
```
Opens an interactive UI where you can:
- See all your tests
- Run tests individually or in groups
- Watch tests execute step-by-step
- Time-travel debug through test execution
- See screenshots and videos

### 3. Debug mode (step through tests)
```bash
npm run test:e2e:debug
```
Opens the Playwright Inspector for detailed debugging.

### 4. Headed mode (see the browser)
```bash
npm run test:e2e:headed
```
Opens a visible browser window so you can watch tests run.

### 5. View test report
```bash
npm run test:e2e:report
```
Opens an HTML report of the last test run with screenshots and videos.

### 6. Generate tests (Codegen)
```bash
npm run test:e2e:codegen
```
Opens your app and records your actions as test code. Great for beginners!

## How to Write Your First Test

### Step 1: Create a test file

Create a new file in the `e2e/` directory with a `.spec.ts` extension:

```bash
e2e/my-feature.spec.ts
```

### Step 2: Write a basic test

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    // 1. Navigate to the page
    await page.goto('/my-page');

    // 2. Interact with elements
    await page.click('button');

    // 3. Assert expectations
    await expect(page.locator('h1')).toHaveText('Success');
  });
});
```

### Step 3: Run your test

```bash
npm run test:e2e:ui
```

## Key Concepts

### 1. Locators (Finding Elements)

Locators find elements on the page. Playwright has multiple ways to locate elements:

```typescript
// By text content (best for buttons, links)
page.locator('button:has-text("Submit")');
page.locator('text=Welcome');

// By role (semantic HTML, accessible)
page.locator('role=button[name="Submit"]');
page.locator('role=textbox[name="Email"]');

// By test ID (most stable, recommended)
page.locator('[data-testid="submit-button"]');

// By CSS selector
page.locator('button.primary');
page.locator('#login-form input[type="email"]');

// First, last, nth
page.locator('button').first();
page.locator('button').nth(2);
page.locator('button').last();
```

**Best Practice**: Use `data-testid` attributes in your components:

```tsx
<button data-testid="create-interview-btn">
  Create Interview
</button>
```

Then in your test:
```typescript
await page.locator('[data-testid="create-interview-btn"]').click();
```

### 2. Actions (Interacting with Elements)

```typescript
// Click
await page.click('button');
await page.locator('button').click();

// Type text
await page.fill('input[name="email"]', 'user@example.com');
await page.type('input', 'text', { delay: 100 }); // Slower typing

// Select from dropdown
await page.selectOption('select', 'option-value');

// Check/uncheck
await page.check('input[type="checkbox"]');
await page.uncheck('input[type="checkbox"]');

// Press keys
await page.press('input', 'Enter');
await page.keyboard.press('Escape');

// Hover
await page.hover('button');

// Upload files
await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');
```

### 3. Assertions (Verifying Results)

```typescript
// Visibility
await expect(page.locator('h1')).toBeVisible();
await expect(page.locator('.error')).not.toBeVisible();

// Text content
await expect(page.locator('h1')).toHaveText('Welcome');
await expect(page.locator('h1')).toContainText('Welcome');

// URL
await expect(page).toHaveURL(/.*dashboard/);
await expect(page).toHaveURL('http://localhost:3000/dashboard');

// Attributes
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('button')).toBeDisabled();
await expect(page.locator('input')).toHaveAttribute('type', 'email');

// Count
await expect(page.locator('li')).toHaveCount(5);

// Value
await expect(page.locator('input')).toHaveValue('test@example.com');
```

### 4. Waiting (Handling Async Operations)

Playwright automatically waits for elements, but sometimes you need explicit waits:

```typescript
// Wait for navigation
await page.waitForURL('**/dashboard');

// Wait for element
await page.waitForSelector('text=Success');

// Wait for load state
await page.waitForLoadState('networkidle');
await page.waitForLoadState('domcontentloaded');

// Wait for timeout (use sparingly)
await page.waitForTimeout(1000); // 1 second

// Wait for function
await page.waitForFunction(() => window.innerWidth < 768);
```

### 5. Test Organization

```typescript
import { test, expect } from '@playwright/test';

// Group related tests
test.describe('Login Feature', () => {

  // Run before each test in this group
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  // Individual test
  test('should login with valid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

## Common Testing Patterns

### Pattern 1: Testing Navigation

```typescript
test('should navigate to pre-screening page', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/pre-screening"]');
  await expect(page).toHaveURL(/.*pre-screening/);
});
```

### Pattern 2: Testing Forms

```typescript
test('should submit form successfully', async ({ page }) => {
  await page.goto('/form-page');

  await page.fill('input[name="name"]', 'John Doe');
  await page.fill('input[name="email"]', 'john@example.com');
  await page.selectOption('select[name="role"]', 'developer');
  await page.check('input[name="terms"]');

  await page.click('button[type="submit"]');

  await expect(page.locator('text=Success')).toBeVisible();
});
```

### Pattern 3: Testing Dialogs/Modals

```typescript
test('should open and close dialog', async ({ page }) => {
  await page.goto('/page-with-dialog');

  // Open dialog
  await page.click('button:has-text("Open Dialog")');

  // Verify dialog is open
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  // Close dialog
  await page.click('button:has-text("Cancel")');

  // Verify dialog is closed
  await expect(dialog).not.toBeVisible();
});
```

### Pattern 4: Testing Tables

```typescript
test('should display table data', async ({ page }) => {
  await page.goto('/data-table');

  // Wait for table to load
  await page.waitForSelector('table');

  // Check row count
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(10);

  // Check specific cell content
  const firstCell = page.locator('table tbody tr:first-child td:first-child');
  await expect(firstCell).toHaveText('Expected Value');
});
```

### Pattern 5: Testing API Responses

```typescript
test('should handle API errors gracefully', async ({ page }) => {
  // Intercept API calls
  await page.route('**/api/data', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' })
    });
  });

  await page.goto('/data-page');

  // Verify error message is shown
  await expect(page.locator('text=Failed to load data')).toBeVisible();
});
```

## Best Practices

### ✅ DO

1. **Use descriptive test names**
   ```typescript
   test('should display error when form is submitted with empty email', ...)
   ```

2. **Test user behavior, not implementation**
   ```typescript
   // Good: Tests what user sees
   await expect(page.locator('text=Welcome John')).toBeVisible();

   // Bad: Tests implementation details
   expect(component.state.user.name).toBe('John');
   ```

3. **Use data-testid for stable selectors**
   ```typescript
   await page.locator('[data-testid="submit-btn"]').click();
   ```

4. **Keep tests independent**
   Each test should be able to run in isolation without depending on other tests.

5. **Use beforeEach for setup**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.goto('/dashboard');
   });
   ```

6. **Test critical user paths first**
   - Login → View dashboard
   - Create new item → Save → Verify it appears
   - Delete item → Verify it's gone

### ❌ DON'T

1. **Don't test external services directly**
   Mock API responses instead.

2. **Don't rely on exact text when unnecessary**
   ```typescript
   // Bad: Breaks if text changes slightly
   await expect(page.locator('h1')).toHaveText('Welcome to Our Amazing App!');

   // Good: Tests the core message
   await expect(page.locator('h1')).toContainText('Welcome');
   ```

3. **Don't use long timeouts unnecessarily**
   ```typescript
   // Bad
   await page.waitForTimeout(5000);

   // Good
   await page.waitForSelector('text=Loaded');
   ```

4. **Don't make tests depend on each other**
   Each test should set up its own state.

5. **Don't test everything**
   Focus on critical paths and complex interactions. Not every button click needs a test.

## Debugging Tests

### 1. Use UI Mode (Recommended)
```bash
npm run test:e2e:ui
```
Best way to debug. You can:
- See all tests
- Watch tests run step-by-step
- See screenshots and traces
- Replay tests

### 2. Use Debug Mode
```bash
npm run test:e2e:debug
```
Opens the Playwright Inspector to step through tests.

### 3. Add Console Logs
```typescript
test('my test', async ({ page }) => {
  console.log('Before clicking');
  await page.click('button');
  console.log('After clicking');
});
```

### 4. Take Screenshots
```typescript
await page.screenshot({ path: 'debug.png' });
```

### 5. Use page.pause()
```typescript
test('my test', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Pauses here, opens inspector
  await page.click('button');
});
```

## Tips for Beginners

1. **Start with Codegen** - Use `npm run test:e2e:codegen` to record tests automatically

2. **Run tests in UI mode** - Use `npm run test:e2e:ui` to see what's happening

3. **Start simple** - Begin with basic navigation tests, then add complexity

4. **Use the example tests** - Check `e2e/example.spec.ts` and `e2e/form-interactions.spec.ts`

5. **Add data-testid attributes** - Makes tests more stable and easier to write

6. **Read the errors** - Playwright gives very helpful error messages

7. **Check the docs** - https://playwright.dev/docs/intro

## CI/CD Integration

In your CI/CD pipeline (GitHub Actions, GitLab CI, etc.), use:

```bash
npm run test:e2e
```

This runs tests in headless mode and generates a report.

### Example GitHub Actions workflow:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Next Steps

1. ✅ Run the example tests: `npm run test:e2e:ui`
2. ✅ Try codegen: `npm run test:e2e:codegen`
3. ✅ Write your first test for a feature you're working on
4. ✅ Add `data-testid` attributes to important elements
5. ✅ Set up CI/CD to run tests automatically

## Useful Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Locators](https://playwright.dev/docs/locators)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)
- [Next.js E2E Testing](https://nextjs.org/docs/app/building-your-application/testing/playwright)

## Questions?

If you get stuck:
1. Check the example tests in the `e2e/` directory
2. Read the Playwright docs: https://playwright.dev/
3. Use the codegen tool to see how Playwright generates tests
4. Try running in UI mode to see what's happening

Happy testing! 🎭
