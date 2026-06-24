---
name: webapp-testing
description: >
  Write, fix, or diagnose Playwright e2e tests for web applications. Use when the task
  involves browser-level verification of a web UI — auth flows, page navigation, feature
  toggles, API integration, flaky test diagnosis, or adding coverage for a new page.
  Invoke whenever the user mentions Playwright tests, e2e tests, browser automation,
  flaky tests, or wants to test a web app feature end-to-end.
license: Complete terms in LICENSE.txt
metadata:
  owner: global-agents
  tier: contextual
  canonical_source: ~/.agents/skills/webapp-testing
---

# Web Application Testing

Playwright-based e2e testing for web apps. This skill covers the full cycle: deciding
what to test, setting up the test environment (auth state, API mocks), writing tests
that don't flake, and diagnosing failures.

For deep Playwright API reference (POM, visual regression, accessibility, CI config)
see `playwright-best-practices`. Use this skill first to frame the problem.

## When to Use Playwright e2e vs Component Unit Tests

Before writing any test, pick the right level:

| Scenario | Preferred approach |
|---|---|
| User flow spanning multiple pages | Playwright e2e |
| A single React component in isolation | Unit test (React Testing Library) |
| API call → state update → UI render cycle | Playwright e2e (with mocked API) |
| Data transformation / business logic | Unit test |
| Auth flow (login, redirect, cookie) | Playwright e2e |
| Accessibility / visual regression | Playwright e2e |

Don't default to e2e for everything — component tests are 10× faster and catch regressions earlier.

## Step 1: Understand the Test Context

Before writing a line of test code:

```bash
# Detect test runner and config
ls playwright.config.ts playwright.config.js 2>/dev/null
cat playwright.config.ts 2>/dev/null

# Find existing test patterns to match
ls tests/e2e/ 2>/dev/null
head -40 tests/e2e/*.spec.ts 2>/dev/null | head -80
```

Note: the `baseURL`, `webServer` command, and any existing helper/fixture imports —
new tests should match the conventions already in place.

## Step 2: Plan Auth and API Strategy

This is the step most tests skip and then regret. Decide before writing:

### Auth state

If the pages under test require a logged-in user:

- **storageState** (recommended): run auth once in a global setup, save to a file,
  load it in tests. No OAuth flow per test.

```typescript
// playwright.config.ts
use: {
  storageState: 'playwright/.auth/user.json',
}

// global-setup.ts — runs once, authenticates, saves state
import { chromium } from '@playwright/test'
export default async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  // set cookies / localStorage manually or go through login once
  await page.context().storageState({ path: 'playwright/.auth/user.json' })
  await browser.close()
}
```

- **Skip auth entirely** by injecting a mock session cookie or spoofing the auth endpoint
  with `page.route()` — valid if the app trusts a cookie without server verification.

### API mocking (almost always needed)

Tests that call a real backend are slow, order-dependent, and fail when the backend
changes. Mock the API with `page.route()`:

```typescript
test.beforeEach(async ({ page }) => {
  await page.route('**/api/guilds/*/autoplay', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ enabled: true, maxTracks: 20 }),
    })
  })
})
```

Mock at the *boundary* (the HTTP call), not deeper. This lets you test the full
rendering and state-update logic without a backend.

## Step 3: Write Tests That Don't Flake

The most common source of flakiness is timing: clicking a button before the response
arrives, or asserting state before the animation finishes.

**Replace every `waitForTimeout` with an event-driven wait:**

```typescript
// ❌ flaky — arbitrary sleep
await page.waitForTimeout(2000)
expect(await page.locator('[data-testid="status"]').textContent()).toBe('Enabled')

// ✅ stable — waits for the actual DOM change
await page.locator('[role="switch"]').click()
await expect(page.locator('[data-testid="status"]')).toHaveText('Enabled')

// ✅ stable — waits for the network round-trip to complete
const [response] = await Promise.all([
  page.waitForResponse('**/api/guilds/*/features/*'),
  page.locator('[role="switch"]').click(),
])
expect(response.status()).toBe(200)
```

Use `expect(locator).toBeVisible()`, `toHaveText()`, `toBeChecked()` — these retry
automatically until the condition is met or the timeout expires.

## Step 4: Write the Test

Organize tests with `test.describe`, handle setup in `beforeEach`, and name tests
so the failure message is self-explanatory:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Autoplay Settings', () => {
  test.beforeEach(async ({ page }) => {
    // API mock
    await page.route('**/api/guilds/*/autoplay', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ enabled: false, maxTracks: 10 }),
      })
    })
    await page.goto('/servers/123/autoplay')
    await page.waitForLoadState('networkidle')
  })

  test('shows autoplay settings loaded from API', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Autoplay' })).toBeVisible()
    await expect(page.getByRole('switch', { name: 'Enable autoplay' })).not.toBeChecked()
  })

  test('shows error state when API fails', async ({ page }) => {
    await page.route('**/api/guilds/*/autoplay', async (route) => {
      await route.fulfill({ status: 500, body: '{}' })
    })
    await page.reload()
    await expect(page.getByText(/something went wrong/i)).toBeVisible()
  })
})
```

## Step 5: Run and Capture Evidence

```bash
# Run the specific test file
npx playwright test tests/e2e/autoplay.spec.ts --reporter=line

# Run with UI for debugging a flaky test
npx playwright test tests/e2e/autoplay.spec.ts --ui

# Run all and open the HTML report
npx playwright test && npx playwright show-report

# Start app manually (if webServer config not set)
python scripts/with_server.py \
  --server "npm run dev" --port 5173 \
  -- npx playwright test
```

## Diagnosing Flaky Tests

1. Run the suite 3× in a row — if it fails intermittently, it's flaky, not broken.
2. Add `--trace on` to capture a step-by-step trace: `npx playwright test --trace on`
3. Open the trace: `npx playwright show-report` → click the failing test → trace tab.
4. Look for: the moment the assertion fires vs when the DOM actually reached the expected state.
5. Fix with event-driven waits (Step 3 patterns above).

## Outputs / Evidence

Return:
- Pass/fail per test with error message if failed
- The mocking strategy used (which routes were stubbed)
- Selectors assumed (flag brittle ones like `.nth(0)` or text that could change)
- Any env / auth prerequisite that blocked the run

## Failure / Stop Conditions

- Stop if `playwright.config.ts` is missing — ask for the project root or create config first.
- Stop if auth setup is unknown and pages require auth — ask how the app stores session state.
- Stop if the app can't start within the `webServer.timeout` — report the startup error.
- Redirect to `agent-browser` for one-off interactive browsing.
- Redirect to `playwright-best-practices` for deep reference (POM, visual testing, axe-core, CI setup).

## Memory Hooks

- Read memory when the repo has established fixture or mock patterns — match them.
- Write memory if this session establishes a new auth-state or API-mock convention.
