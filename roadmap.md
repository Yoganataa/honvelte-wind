# Roadmap

> Status snapshot: 2026-10-31  
> Product direction: an opinionated, modular starter for production web applications—not a single repository that ships every framework, platform, and infrastructure dependency.

## Product principles

1. **Keep the core lean.** The default install should stay fast and understandable. Databases, queues, authentication, storage, and observability belong in optional modules or presets unless the application requires them.
2. **Make boundaries explicit.** Keep UI, HTTP transport, application logic, shared contracts, and infrastructure separable.
3. **Prefer reproducibility over convenience.** Pin runtimes and dependencies, make CI deterministic, and test the packaged production output.
4. **Support different deployment targets through adapters.** Do not couple application code to a single hosting vendor.
5. **Do not claim universal support prematurely.** Mobile, desktop, CLI, game tooling, data engineering, and embedded projects need dedicated profiles rather than being forced into this web starter.

## Current baseline

The repository currently provides:

- Bun workspaces with a Svelte 5 + Vite SPA, Hono API, Tailwind CSS 4, TypeScript, and shared Zod contracts.
- Feature-oriented web UI, reusable accessible form/button primitives, centralized design tokens, keyboard focus defaults, and reduced-motion support.
- Optional SQLite and PostgreSQL adapter examples using Bun-native drivers, with versioned SQL migrations and isolated integration tests; the default workspace remains database-free.
- Optional server-side session, OIDC identity, CSRF, and RBAC example; the default workspace remains provider- and auth-dependency-free.
- ESLint, Prettier, TypeScript/Svelte checks, Bun tests, and Playwright E2E tests.
- GitHub Actions quality, browser E2E, and production-bundle jobs.
- A production tarball smoke test that exercises the extracted bundle, API health endpoint, and SPA response.
- Agent instructions and local skills for implementation, testing, and browser E2E.

The dependency toolchain has been refreshed to Bun 1.4.4, ESLint 10, TypeScript 6, Vite 8, Svelte Vite Plugin 7, and current stable compatible packages. A Bun 1.4.4 `bun.lock` is committed and every CI install uses `--frozen-lockfile`. CI also runs a Bun advisory audit, dependency review, and a three-day package release-age gate. `format:check` is part of `bun run verify`. Repository rulesets and repository-level Dependabot alert/security-update toggles are still not configured.

## Priorities

### P0 — Reproducible and governed baseline

| Item                                 | Current status                           | Completion criteria                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commit `bun.lock`                    | Done in this change                      | Bun 1.4.4 lockfile is committed; all CI jobs use `bun install --frozen-lockfile` with no unlocked fallback.                                                                                                                                                                                              |
| Restore formatting as a quality gate | Done in this change                      | Applied the Prettier baseline to tracked files; `format:check` is part of `bun run verify` and runs in CI.                                                                                                                                                                                               |
| Protect `main`                       | Open — no repository rulesets configured | Add a ruleset targeting `main`; require pull requests and the four checks `Quality gates`, `Browser E2E`, `Analyze JavaScript and TypeScript`, and `Review dependency changes`; block force pushes and deletion.                                                                                         |
| Pin GitHub Actions                   | Done in this change                      | Checkout v7.0.1, Bun setup v2, artifact upload v7, CodeQL v4.39.1, and Dependency Review v5 use verified full commit SHAs; Dependabot checks action updates weekly.                                                                                                                                      |
| Security scanning                    | Partially implemented                    | CodeQL, `bun audit` at low severity, three-day release-age cooldown, dependency review, grouped Dependabot version updates, and `SECURITY.md` are active. Dependabot alerts and security updates still need repository-level enablement; Bun lockfiles are not represented in GitHub's dependency graph. |
| API body limit                       | Done in this change                      | Enforces the 1 KiB limit against streamed bytes, with a fast `Content-Length` rejection and a regression test for requests without that header.                                                                                                                                                          |

**P0 exit gate:** a clean checkout installs only from the committed lockfile; formatting, lint, type checks, unit tests, E2E, and production artifact smoke tests pass; protected `main` cannot accept an unverified change.

### P1 — Application architecture and test confidence

| Workstream                       | Scope                                                                                                                                     | Acceptance criteria                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API composition                  | Split routes, middleware, services/use-cases, and infrastructure by feature when complexity justifies it.                                 | Route modules remain thin; business rules can be tested without an HTTP server; no circular app/package imports.                                                                                        |
| Shared API contract              | Standardize success/error envelopes and validation error handling. Generate or maintain a typed browser API client from shared contracts. | UI does not duplicate request/response types or parse unstable error strings.                                                                                                                           |
| Frontend foundations             | Organize UI and API calls by feature; establish accessible shared primitives and design tokens; keep routing optional.                    | Feature code remains separate from shared controls; accessible labels/errors and keyboard navigation are tested; reduced motion is respected; no router required by default.                            |
| Database adapters                | Completed — optional SQLite and PostgreSQL examples using Bun-native drivers.                                                             | Ordered SQL migrations are versioned; SQLite tests use isolated in-memory databases; PostgreSQL integration tests use a dedicated disposable database; no database dependency in the default starter.   |
| Authentication and authorization | Completed — optional server-side sessions, OIDC identity boundary, CSRF protection, and server-side RBAC example.                         | Opaque verifier-based sessions, secure cookie policy, exact Origin + synchronizer token checks, issuer/subject identity mapping, per-request permission lookup, SQLite persistence, and isolated tests. |
| Test strategy                    | API/contracts coverage gates and automated axe-core accessibility scans are active for initial, validation, and success UI states.        | CI retains LCOV reports; meaningful assertions and stable tests remain required; manually review keyboard/screen-reader behavior because automated scans cannot prove full WCAG conformance.            |
| API request safety               | Add rate limiting and request timeouts at a clearly defined boundary when exposed publicly.                                               | Limits are configurable, tested, and documented for in-memory versus distributed deployments.                                                                                                           |

**API composition progress (this PR):** The API now composes feature-scoped health and greeting route modules, a request-ID middleware, and shared HTTP utilities for bounded JSON parsing and centralized error responses. Regression tests cover request-ID propagation, missing and oversized bodies, validation failures, malformed JSON, and sanitized unexpected errors. This establishes the transport/module boundaries without introducing placeholder services; extract domain services/use-cases when actual business rules need independent testing.

**Frontend foundation progress (this PR):** The page shell is separated from feature-owned greeting and stack modules. The greeting API boundary validates unknown network payloads against shared Zod contracts. Small Button and TextField primitives provide semantic controls, accessible labels/error descriptions, busy/disabled state, and consistent focus styles. Tailwind design tokens centralize the dark palette, global focus indication is visible, reduced-motion preferences are respected, and E2E coverage exercises keyboard navigation and error recovery. Routing remains intentionally deferred until the app has multiple real routes.

**Authentication and authorization progress (this PR):** Added an optional example outside the default workspaces: opaque session IDs with a SHA-256 verifier hash, bounded server-side expiry, revocation, a SQLite store, `__Host-` production cookies, synchronizer CSRF tokens plus exact Origin validation, and permission middleware that resolves current permissions server-side. The OIDC boundary maps validated identities by issuer and subject; the provider flow is documented with `openid-client` v6 Authorization Code + PKCE, state, and nonce. No auth provider or new package is installed by default. CI tests the session, CSRF, SQLite, identity mapping, and RBAC behavior.

**Database adapter progress (this PR):** Added separate SQLite and PostgreSQL examples outside the Bun workspaces. SQLite uses the built-in `bun:sqlite` driver with WAL for file-backed databases; PostgreSQL uses Bun.SQL with a bounded pool, parameterized operations, and transaction-scoped advisory locking for migrations. Both use ordered SQL migration files and a schema migration ledger. CI exercises SQLite in-memory tests and PostgreSQL integration tests against a disposable PostgreSQL 18.6 service. No database driver, ORM, or database service is added to the default installation.

**Shared API contract progress (PR #10):** The greeting endpoint now has shared Zod schemas for success responses and API error envelopes. The API tests validate endpoint payloads against those schemas, and the browser validates unknown response payloads before using them. This is a partial P1 completion; a reusable typed API client is intentionally deferred until multiple endpoints justify a shared transport abstraction.

**P1 exit gate:** a medium-sized application can add a feature end-to-end without putting business logic in route handlers or duplicating contracts, and critical behavior has meaningful automated coverage.

### P2 — Production operations and deployment

| Workstream                  | Scope                                                                                                          | Acceptance criteria                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime/deployment profiles | Document and test Bun server, static hosting, and supported serverless/edge adapters where APIs permit.        | Each profile has a reproducible build, deployment instructions, environment contract, and smoke test.                                 |
| Delivery automation         | Add opt-in deploy jobs for selected providers, with separate staging and production environments.              | Deployment requires explicit environment configuration; secrets are not stored in repository files; rollback procedure is documented. |
| Observability               | Structured logs, configurable log levels, request correlation, metrics, tracing, and error reporting adapters. | Sensitive data is redacted; health and readiness semantics are distinct; telemetry can be disabled or replaced.                       |
| Runtime resilience          | Graceful shutdown, bounded request handling, health/readiness checks, and documented proxy trust.              | Shutdown drains work safely; readiness reflects dependencies; operational limits are configurable.                                    |
| Background work             | Optional queue/job adapter and scheduled task pattern.                                                         | Jobs are idempotent, retry policies are bounded, and no queue service is required by the base starter.                                |
| Storage                     | Optional object-storage adapter with local development strategy.                                               | File size/type validation and authorization are enforced server-side; provider credentials remain server-only.                        |

**P2 exit gate:** a selected deployment profile can move through staging to production with health checks, telemetry, secrets management, and a documented rollback path.

### P3 — Multi-project starter ecosystem

Create separate profiles or generators instead of adding every stack to the default workspace:

- **Web:** SPA, SSR, and API-backed web application profiles.
- **Backend:** API service, worker, and serverless/edge profiles.
- **Desktop:** Tauri or another selected desktop shell with a shared UI boundary.
- **Mobile:** native Android/iOS or a selected cross-platform profile.
- **Developer tools:** CLI and automation profiles.
- **Data/ML and game tooling:** dedicated templates with their own runtime and testing requirements.

A profile is eligible for inclusion when it has an owner, a maintained dependency set, a documented architecture, automated checks, and a working example deployment/build. Avoid creating empty templates that only duplicate directory structure.

## Explicit non-goals

- Shipping every frontend framework or backend runtime in one default install.
- Forcing Docker, a database, Redis, an ORM, authentication, or a cloud vendor on every project.
- Describing the repository as suitable for all kinds of development before dedicated profiles exist.
- Treating a successful CI build or uploaded artifact as proof of a live production deployment.

## Maintenance rules

- Revisit priorities when a concrete project need justifies them; do not add infrastructure speculatively.
- Every optional module must state its dependencies, operational requirements, security implications, and removal path.
- Every new profile must pass the same baseline quality gates and include profile-specific tests.
- Update this roadmap when work is completed, deferred, or rejected, and keep status labels factual.

**Test strategy progress (PR #14):** Bun coverage is collected for the API and shared contracts packages during `bun run verify`. CI prints line/function summaries and uploads LCOV reports. The baseline is 96.21% lines/100% functions for the API workspace and 100% for both metrics in contracts; `app.ts` is at 84.85% line coverage. The 80% line/90% function per-file guardrail is active. Playwright now runs axe-core scans against WCAG 2.0/2.1/2.2 A/AA and best-practice rules for the initial page, validation feedback, and success feedback. Automated scans do not replace manual keyboard, screen-reader, and interaction review.
