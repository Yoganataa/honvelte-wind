---
name: testing
description: Design and implement unit, integration, contract, and regression tests for the web, API, and shared packages in this Bun monorepo.
---

# Testing

1. Read root `AGENTS.md` and identify the correct package boundary.
2. Use Bun's test runner for API and shared-contract unit/integration tests.
3. Test observable behavior, status codes, response schemas, validation failures, and error paths.
4. Prefer testing Hono with `app.request()` instead of opening a real port for API integration tests.
5. Cover valid input, missing fields, malformed JSON, oversized payloads, unknown routes, and request correlation headers where applicable.
6. Keep tests deterministic; do not depend on real third-party services or wall-clock timing.
7. Do not mock the function under test. Mock external boundaries only.
8. Run `bun run test`, then `bun run verify`; run E2E for user-visible workflows.
9. Add a regression test whenever fixing a reproducible defect.
10. In the final report distinguish executed tests from tests that were only authored.
