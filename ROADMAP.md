# Roadmap

> Status snapshot: 2026-11-01  
> Product direction: an opinionated, modular starter for production web applications—not a single repository that ships every framework, platform, and infrastructure dependency.
> Design reference: see [DESIGN.md](./DESIGN.md) for UI tokens, component rules, and accessibility requirements.

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
- Root engineering references: `AGENTS.md`, `DESIGN.md`, `ROADMAP.md`, and `SECURITY.md`; the root filename/casing convention is documented in `AGENTS.md`.
- A public `robots.txt` policy is served from the web public assets and verified by Playwright, local `workerd` smoke tests, live deployment checks, and rollback verification.
- Cloudflare Workers staging and production environments are configured in the upstream repository. Both environments have completed live deployments with health, greeting API, SPA, `robots.txt`, and static asset verification.
- Lighthouse lab reports supplied on 2026-11-01 showed 100 for Performance, Accessibility, Best Practices, and SEO on both mobile and desktop. Agentic Optimization was 2/4; CrUX field data was unavailable, so these scores are not real-user measurements.

The dependency toolchain has been refreshed to Bun 1.4.4, ESLint 10, TypeScript 6, Vite 8, Svelte Vite Plugin 7, and current stable compatible packages. A Bun 1.4.4 text-based `bun.lock` is committed and every CI install uses `--frozen-lockfile`. CI also runs a Bun advisory audit, dependency review, and a three-day package release-age gate. `format:check` is part of `bun run verify`. The active `Protect main` repository ruleset requires pull requests, up-to-date required checks, and blocks force pushes and deletion. The dependency graph, automatic dependency submission, Dependabot alerts and security updates, malware alerts, private vulnerability reporting, and secret protection are enabled.

## Priorities

### P0 — Reproducible and governed baseline

- **Commit `bun.lock` — Done.** Bun 1.4.4 lockfile is committed; all CI jobs use `bun install --frozen-lockfile` with no unlocked fallback.
- **Restore formatting as a quality gate — Done.** The Prettier baseline is applied to tracked files; `format:check` is part of `bun run verify` and runs in CI.
- **Protect `main` — Done.** The active `Protect main` ruleset targets `refs/heads/main`, requires pull requests and the four required checks, requires the branch to be up to date, blocks force pushes and deletion, and has no bypass actors.
- **Pin GitHub Actions — Done.** Checkout v7.0.1, Bun setup v2, artifact upload v7, CodeQL v4.39.1, and Dependency Review v5 use verified full commit SHAs; Dependabot checks action updates weekly.
- **Security scanning — Done.** CodeQL, `bun audit` at low severity, the three-day release-age cooldown, dependency review, Bun/GitHub Actions version updates, `SECURITY.md`, the dependency graph, automatic dependency submission, Dependabot alerts/security updates, malware alerts, private vulnerability reporting, and secret protection are enabled. GitHub supports Bun 1.4 and text-based `bun.lock`.
- **API body limit — Done.** The 1 KiB limit is enforced against streamed bytes, with a fast `Content-Length` rejection and a regression test for requests without that header.

**P0 exit gate:** a clean checkout installs only from the committed lockfile; formatting, lint, type checks, unit tests, E2E, and production artifact smoke tests pass; protected `main` cannot accept an unverified change.

### P1 — Application architecture and test confidence

| Workstream                       | Scope                                                                                                                              | Acceptance criteria                                                                                                                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API composition                  | Split routes, middleware, services/use-cases, and infrastructure by feature when complexity justifies it.                          | Route modules remain thin; business rules can be tested without an HTTP server; no circular app/package imports.                                                                                                             |
| Shared API contract              | Completed — shared Zod request/response contracts and typed same-origin browser client.                                            | Health and greeting responses are runtime-validated; outgoing greeting input is parsed; structured API errors expose status/code/request ID; malformed/network/abort cases are tested; browser bundle has no server imports. |
| Frontend foundations             | Completed — feature-owned UI, accessible shared primitives, design tokens, keyboard behavior, and reduced-motion defaults.         | Feature UI is separated from shared controls; labels and error descriptions are associated; focus is visible; keyboard and axe-core tests cover key states; reduced motion is respected; routing remains optional.           |
| Database adapters                | Completed — optional SQLite and PostgreSQL examples using Bun-native drivers.                                                      | Ordered SQL migrations are versioned; SQLite tests use isolated in-memory databases; PostgreSQL integration tests use a dedicated disposable database; no database dependency in the default starter.                        |
| Authentication and authorization | Completed — optional server-side sessions, OIDC identity boundary, CSRF protection, and server-side RBAC example.                  | Opaque verifier-based sessions, secure cookie policy, exact Origin + synchronizer token checks, issuer/subject identity mapping, per-request permission lookup, SQLite persistence, and isolated tests.                      |
| Test strategy                    | API/contracts coverage gates and automated axe-core accessibility scans are active for initial, validation, and success UI states. | CI retains LCOV reports; meaningful assertions and stable tests remain required; manually review keyboard/screen-reader behavior because automated scans cannot prove full WCAG conformance.                                 |
| API request safety               | Completed — optional fixed-window rate limiting and request-deadline/cancellation boundary.                                        | Bounded in-memory store for one process; pluggable shared-store contract; explicit trusted principal key; 429/503 behavior; 504 + propagated AbortSignal; streaming routes excluded; tests cover limits and deadlines.       |

**API composition progress (this PR):** The API now composes feature-scoped health and greeting route modules, a request-ID middleware, and shared HTTP utilities for bounded JSON parsing and centralized error responses. Regression tests cover request-ID propagation, missing and oversized bodies, validation failures, malformed JSON, and sanitized unexpected errors. This establishes the transport/module boundaries without introducing placeholder services; extract domain services/use-cases when actual business rules need independent testing.

**Frontend foundations completion (PR #21):** The page shell composes feature-owned greeting and stack modules. Reusable Button and TextField primitives provide semantic controls, associated labels/error descriptions, busy/disabled state, and visible focus styles. Tailwind design tokens centralize the palette, global focus indication is visible, and reduced-motion preferences are respected. Playwright verifies keyboard navigation, validation/error recovery, and axe-core scans the initial, validation, and success states against WCAG A/AA and best-practice rules. Routing remains intentionally deferred until the app has multiple real routes.

**Shared API contract progress (this PR):** Added a typed browser API client for health and greeting endpoints under `apps/web/src/lib/api`. It validates request and response payloads with Zod contracts from `packages/contracts`, uses same-origin credentials, preserves structured error codes/status/request IDs, and distinguishes malformed responses, network errors, aborts, and timeouts. Greeting feature code now delegates to the shared client, and the client test suite runs in `verify`. No server implementation is imported into the browser bundle.

**API request safety progress (this PR):** Added an optional route-scoped fixed-window limiter with a bounded in-memory store and a pluggable `RateLimitStore` contract. The middleware requires an explicit principal-key selector, emits rate-limit headers, returns 429 on quota exhaustion, and fails closed with 503 when the bounded local store is full. Added request-deadline middleware that returns 504 and propagates an `AbortSignal` for downstream cancellation. Documentation distinguishes single-process counters from a shared Redis/Valkey implementation and excludes streaming endpoints. CI runs strict TypeScript checks and deterministic middleware tests; no new dependency or service is added to the default workspace.

**Authentication and authorization progress (this PR):** Added an optional example outside the default workspaces: opaque session IDs with a SHA-256 verifier hash, bounded server-side expiry, revocation, a SQLite store, `__Host-` production cookies, synchronizer CSRF tokens plus exact Origin validation, and permission middleware that resolves current permissions server-side. The OIDC boundary maps validated identities by issuer and subject; the provider flow is documented with `openid-client` v6 Authorization Code + PKCE, state, and nonce. No auth provider or new package is installed by default. CI tests the session, CSRF, SQLite, identity mapping, and RBAC behavior.

**Database adapter progress (this PR):** Added separate SQLite and PostgreSQL examples outside the Bun workspaces. SQLite uses the built-in `bun:sqlite` driver with WAL for file-backed databases; PostgreSQL uses Bun.SQL with a bounded pool, parameterized operations, and transaction-scoped advisory locking for migrations. Both use ordered SQL migration files and a schema migration ledger. CI exercises SQLite in-memory tests and PostgreSQL integration tests against a disposable PostgreSQL 18.6 service. No database driver, ORM, or database service is added to the default installation.

**Initial shared contract work (PR #10):** The greeting endpoint introduced shared Zod schemas for success responses and API error envelopes. This was the first step; the typed multi-endpoint browser client and health contract are completed in the follow-up workstream above.

**P1 exit gate:** a medium-sized application can add a feature end-to-end without putting business logic in route handlers or duplicating contracts, and critical behavior has meaningful automated coverage.

### P2 — Production operations and deployment

- **Runtime/deployment profiles — Partially implemented.** The default Bun server profile has a production delivery artifact and extracted-bundle smoke test. The Cloudflare Workers profile (static SPA assets + Hono Fetch adapter) is deployed to this repository's staging and production environments and has passed live verification. Generic static hosts and other serverless/edge providers remain unverified.
- **Delivery automation — Implemented for the upstream Cloudflare profile.** Main-only manual staging/production deploy and explicit rollback workflows use environment-scoped secrets, protection rules, concurrency control, local `workerd` verification, live health/API/SPA/robots/static-asset checks, and an automatic previous-version rollback attempt after failed deployment verification. A new fork or independent installation must provision its own GitHub Environments, Cloudflare credentials, Worker resources, and approval policy. Other hosting providers remain out of scope.
- **Observability — Baseline implemented.** Structured JSON logs with active severity filtering and central redaction, validated request correlation, low-cardinality HTTP request counters/errors/latency histogram/active gauge, and an opt-in bearer-protected Prometheus scrape endpoint. External exporters, distributed tracing, and replaceable error-reporting adapters remain open.
- **Runtime resilience — Baseline implemented.** Graceful SIGINT/SIGTERM shutdown, readiness propagation delay, Bun-native drain with bounded force-close, separate liveness/readiness probes, and configurable idle/body limits are implemented. Readiness reflects lifecycle until the application declares mandatory external dependencies.
- **Background work — Partially implemented.** Added a provider-independent job envelope/runner and idempotency-store contract, runtime payload validation (including rejection of undefined before enqueueing), token-fenced lease processing, capped full-jitter retry backoff, deterministic scheduled-job IDs, and optional Cloudflare Queues + D1 adapters. Queue provisioning, provider retry/DLQ configuration, and workload-specific deployment validation remain application/operator responsibilities.
- **Storage — Open.** Add an optional object-storage adapter and local development strategy with server-side file size/type validation, authorization, and server-only provider credentials.

- **UI and documentation platform — Planned.** Adopt shadcn-svelte as the source-owned component foundation; add OpenAPI + Scalar from shared Zod contracts; evaluate Histoire for isolated Svelte component stories; add Astro Starlight under `apps/docs`; use TypeDoc only for selected public TypeScript APIs. This is a staged proposal, not an implemented capability. See [the UI and documentation platform checkpoint](docs/roadmap/documentation-and-ui-platform.md) for decisions, compatibility gates, phases, acceptance criteria, and resume instructions.

**P2 exit gate:** met for the Cloudflare Workers profile in this upstream repository: staging and production deployments passed live health/API/SPA/robots/static-asset checks, environment-scoped secrets are configured, and a manual/automatic rollback path is available. A live Bun hosting target and additional hosting providers remain unverified; external telemetry and distributed tracing remain open.

**Cloudflare Workers profile progress:** The repository provides a Fetch entry point and Wrangler Static Assets configuration. The Svelte build is served as an SPA while `/api/*` is routed to Hono. CI validates the adapter and starts the local `workerd` runtime to smoke-test health, greeting, SPA fallback, and `robots.txt`. The Worker profile intentionally excludes Bun-specific lifecycle hooks, Bun-native database examples, the single-process in-memory rate limiter, and process-local Prometheus collection. This upstream repository has live staging and production Workers; the optional examples still require Worker-compatible adapters before they can run on this profile.

**Cloudflare delivery automation progress:** Separate `workflow_dispatch` workflows for deployment and rollback are restricted to `main`, select staging or production explicitly, use GitHub Environment-scoped credentials, and serialize operations per target. Deployment executes full verification, a local `workerd` smoke test, deploys with a pinned Wrangler version, and verifies the live health endpoint, greeting API, SPA HTML, valid `robots.txt`, and referenced JavaScript/CSS assets. Failed live verification triggers an attempt to restore the previous Worker version while keeping the run failed for investigation. Manual rollback requires an exact version UUID and verifies health, SPA, robots, and static assets. The upstream repository's staging and production environments have both completed successful live deployments; a fork must provision its own environments, secrets, variables, Worker resources, and approval configuration.

**Verified upstream rollout (2026-11-01):** The robots policy was merged in PR #31 and deployed to staging in run #41275259877 and production in run #41275741903. Both runs passed live smoke verification. The production PageSpeed screenshots supplied for mobile and desktop showed 100 in Performance, Accessibility, Best Practices, and SEO. These are Lighthouse lab results; field data was not available.

**Background work progress (this PR):** Added a provider-independent job envelope and runner with per-handler Zod validation, an atomic lease/idempotency store contract, fencing tokens, bounded full-jitter retry delays, and stable IDs for scheduled occurrences. The optional Cloudflare Queues adapter retries failed, busy, invalid, and unknown-type messages individually, and acknowledges only completed or previously completed jobs. The D1 adapter uses a conditional UPSERT for atomic claims, token-checked completion/release, bounded expiry cleanup, and a migration. Queue retry count and DLQ routing remain provider configuration. This is at-least-once processing, not exactly-once side effects; handlers must pass the job key into downstream idempotent operations. No queue or D1 database is provisioned by the default starter.

**Observability progress (this PR):** Added a JSON console logger with an active `LOG_LEVEL` threshold, recursive sensitive-field and bearer-token redaction, safe error serialization, and per-request completion logs using Hono route templates. Added a bounded in-process Prometheus registry for request totals, 5xx totals, duration histograms, and active requests. `GET /api/metrics` is disabled by default and requires a 32-character minimum bearer token when enabled. Metrics remain process-local; external exporters and tracing are intentionally deferred.

**Runtime resilience progress (this PR):** The Bun entry point now handles `SIGINT` and `SIGTERM`, flips readiness first, waits a configurable propagation delay, lets Bun drain in-flight HTTP requests, and force-closes remaining connections after a configurable grace period. The server has validated idle-timeout and maximum-body-size settings. `/api/health` remains liveness; `/api/ready` reports lifecycle readiness. Because the default application has no mandatory external services, dependency reachability checks remain an application-specific extension rather than a false-positive readiness claim.

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

**Manual accessibility review (documented):** Added a repeatable checklist at [docs/testing/accessibility-manual-checklist.md](docs/testing/accessibility-manual-checklist.md) for keyboard-only use, screen-reader announcements, zoom/reflow, contrast, and reduced motion. The checklist has not been executed; record results per browser and assistive-technology environment before treating manual review as complete.
