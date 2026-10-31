---
name: playwright-e2e
description: Create, run, and debug Playwright end-to-end tests for real user workflows in the Honvelte Wind SPA and Hono API.
---

# Playwright E2E

1. Read root `AGENTS.md` and inspect `tests/e2e/playwright.config.ts`.
2. Test realistic browser journeys through the public app, not private implementation details.
3. Cover initial SPA rendering, form submission, success state, validation state, network/API errors, route fallback, and API health.
4. Use role-, label-, and text-based locators. Avoid brittle CSS selectors and arbitrary sleeps.
5. Keep tests isolated and deterministic; use Playwright auto-waiting and explicit response assertions.
6. E2E config builds the SPA, starts the Bun production server, waits for readiness, and cleans up through Playwright webServer.
7. Capture traces on first retry and retain screenshots/videos only on failure unless debugging requires more.
8. Run `bun run test:e2e`; inspect HTML report and traces when failures occur.
9. Never claim E2E passed unless the browser suite was actually executed.
