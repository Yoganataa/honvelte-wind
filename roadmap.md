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
- ESLint, Prettier, TypeScript/Svelte checks, Bun tests, and Playwright E2E tests.
- GitHub Actions quality, browser E2E, and production-bundle jobs.
- A production tarball smoke test that exercises the extracted bundle, API health endpoint, and SPA response.
- Agent instructions and local skills for implementation, testing, and browser E2E.

The current CI run is green, but the baseline is not yet fully reproducible or production-hardened. In particular, `bun.lock` is not committed, the workflow falls back to an unlocked install, formatting is not part of the blocking `verify` command, and `main` has no required status checks configured.

## Priorities

### P0 — Reproducible and governed baseline

| Item | Current status | Completion criteria |
| --- | --- | --- |
| Commit `bun.lock` | Open — no lockfile in repository | Generate with the pinned Bun version, commit it, and use `bun install --frozen-lockfile` in every CI job. Remove the unlocked fallback. |
| Restore formatting as a quality gate | Open — `format:check` is separate from `verify` | Run Prettier across the repository, review the formatting-only diff, add `format:check` to `verify`, and keep CI documentation aligned. |
| Protect `main` | Open — branch protection is disabled | Require pull requests and successful Quality gates + Browser E2E checks; disable force pushes and deletion. Confirm the selected check names against a real PR. |
| Pin GitHub Actions | Open — actions use version tags | Pin third-party actions to verified full commit SHAs and add Dependabot updates for Actions. |
| Security scanning | Open | Add CodeQL for TypeScript/JavaScript, dependency vulnerability checks, and a documented security reporting process. Keep permissions least-privilege. |
| API body limit | In progress | Enforce the 1 KiB limit against bytes actually read, not only the optional `Content-Length` header; cover requests without that header in tests. |

**P0 exit gate:** a clean checkout installs only from the committed lockfile; formatting, lint, type checks, unit tests, E2E, and production artifact smoke tests pass; protected `main` cannot accept an unverified change.

### P1 — Application architecture and test confidence

| Workstream | Scope | Acceptance criteria |
| --- | --- | --- |
| API composition | Split routes, middleware, services/use-cases, and infrastructure by feature when complexity justifies it. | Route modules remain thin; business rules can be tested without an HTTP server; no circular app/package imports. |
| Shared API contract | Standardize success/error envelopes and validation error handling. Generate or maintain a typed browser API client from shared contracts. | UI does not duplicate request/response types or parse unstable error strings. |
| Frontend foundations | Add an optional router, reusable accessible primitives, and feature-level organization. | Routing and UI dependencies are opt-in; keyboard navigation and accessible names are covered by tests. |
| Database adapters | Provide documented examples for SQLite and PostgreSQL with migrations; select one only when a project profile needs it. | Schema changes are versioned; integration tests use an isolated test database; no database dependency in the default starter. |
| Authentication and authorization | Offer an adapter boundary for sessions/OIDC and explicit RBAC/permission checks. | Secure cookie/session defaults, CSRF strategy where applicable, authorization tests, and no secrets in client bundles. |
| Test strategy | Add coverage reporting and thresholds, API integration tests, accessibility checks, and critical-path regression tests. | Thresholds are evidence-based; flaky tests are not hidden with retries; reports are retained in CI. |
| API request safety | Add rate limiting and request timeouts at a clearly defined boundary when exposed publicly. | Limits are configurable, tested, and documented for in-memory versus distributed deployments. |

**P1 exit gate:** a medium-sized application can add a feature end-to-end without putting business logic in route handlers or duplicating contracts, and critical behavior has meaningful automated coverage.

### P2 — Production operations and deployment

| Workstream | Scope | Acceptance criteria |
| --- | --- | --- |
| Runtime/deployment profiles | Document and test Bun server, static hosting, and supported serverless/edge adapters where APIs permit. | Each profile has a reproducible build, deployment instructions, environment contract, and smoke test. |
| Delivery automation | Add opt-in deploy jobs for selected providers, with separate staging and production environments. | Deployment requires explicit environment configuration; secrets are not stored in repository files; rollback procedure is documented. |
| Observability | Structured logs, configurable log levels, request correlation, metrics, tracing, and error reporting adapters. | Sensitive data is redacted; health and readiness semantics are distinct; telemetry can be disabled or replaced. |
| Runtime resilience | Graceful shutdown, bounded request handling, health/readiness checks, and documented proxy trust. | Shutdown drains work safely; readiness reflects dependencies; operational limits are configurable. |
| Background work | Optional queue/job adapter and scheduled task pattern. | Jobs are idempotent, retry policies are bounded, and no queue service is required by the base starter. |
| Storage | Optional object-storage adapter with local development strategy. | File size/type validation and authorization are enforced server-side; provider credentials remain server-only. |

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
