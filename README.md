# Honvelte Wind

A full-stack starter built with Svelte 5 + Vite SPA, Hono, Tailwind CSS 4, TypeScript, and Bun Workspaces. Production is served by one Bun process: Hono handles API routes and serves the built SPA.

## Requirements

- Bun 1.4.4 (pinned in `.bun-version`)
- Git

## Quick start

```bash
bun install
cp .env.example .env
bun run dev
```

Web: http://127.0.0.1:5173  
API health: http://127.0.0.1:3000/api/health

## Commands

| Command                       | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `bun run dev`                 | Run API and Vite concurrently                                           |
| `bun run build`               | Build contracts and SPA                                                 |
| `bun run start`               | Serve API + static SPA with Bun                                         |
| `bun run check`               | TypeScript and Svelte diagnostics                                       |
| `bun run lint`                | ESLint                                                                  |
| `bun run format:check`        | Prettier formatting check                                               |
| `bun run audit`               | Audit locked dependencies for known advisories                          |
| `bun run test`                | Fast API and contracts unit tests                                       |
| `bun run test:coverage`       | Run API and contracts tests with text and LCOV coverage reports         |
| `bun run test:db-examples`    | Test the optional SQLite and PostgreSQL adapter examples                |
| `bun run test:auth-examples`  | Test optional session, CSRF, OIDC identity, and RBAC examples           |
| `bun run test:web-client`     | Test the typed browser API client                                       |
| `bun run test:request-safety` | Test optional rate limiting and request deadline middleware             |
| `bun run test:e2e`            | Playwright browser tests                                                |
| `bun run verify`              | Formatting, audit, lint, typecheck, unit tests with coverage, and build |
| `bun run verify:all`          | All verification including DB, auth, request safety, and browser E2E    |

## Architecture

- `apps/web`: Svelte 5 SPA, Vite, Tailwind CSS 4.
- `apps/api`: Hono composition root, feature routes, request middleware, HTTP safety/error utilities, and Bun production entry point.
- `packages/contracts`: Zod schemas and shared API contracts.
- `.agents/skills`: canonical Agent Skills source.
- `AGENTS.md`: repository-wide instructions for coding agents.

The API composition root is `apps/api/src/app.ts`. Feature endpoints live in `apps/api/src/routes`, cross-cutting request middleware in `apps/api/src/middleware`, and reusable HTTP parsing/error handling in `apps/api/src/http`. Keep route handlers focused on HTTP orchestration. Introduce feature services/use-cases when real business rules need to be tested independently; do not add empty service layers for trivial examples.

The web app composition root is `apps/web/src/App.svelte`. Keep feature-owned UI, state, and API calls in `apps/web/src/features/<feature>`. Put small primitives shared across features in `apps/web/src/lib/components/ui`; keep theme tokens and global focus/reduced-motion defaults in `app.css`. Use native HTML semantics and defer client-side routing until multiple real routes need it.

The web app calls `/api` through Vite proxy in development. In production Hono serves `apps/web/dist` and handles SPA fallback. Keep API routes under `/api/*`.

See [roadmap.md](./roadmap.md) for the engineering priorities, acceptance criteria, and planned project profiles.

## Shared API client

The browser uses a shared typed client under `apps/web/src/lib/api`. Its `health()` and `greet()` methods validate outgoing greeting input and parse successful responses with Zod contracts from `packages/contracts`. It normalizes structured HTTP errors into `ApiClientError` with HTTP status, shared error code, and request ID when available. The client is same-origin by default and supports `AbortSignal`; no API server implementation is imported into the browser.

Run `bun run test:web-client` for the client tests. The same suite is part of `bun run verify`.

## Optional database adapters

The base workspace intentionally includes no database driver or ORM. Runnable examples are kept outside the Bun workspaces under `examples/databases`, so they do not add packages to the default install:

- **SQLite:** Bun's built-in `bun:sqlite` driver, a local file, WAL mode for file-backed use, and synchronous repository methods.
- **PostgreSQL:** Bun's built-in `Bun.SQL` adapter, a bounded connection pool, parameterized queries, transaction-scoped migration locking, and asynchronous repository methods. The CI integration service uses PostgreSQL 18.6.

Both examples include ordered SQL migrations and a `schema_migrations` ledger. Start with `examples/databases/README.md` and the database-specific README before copying an adapter into an application. Do not edit an applied migration; add the next numbered migration instead.

Run `bun run test:db-examples` to test SQLite and the optional PostgreSQL example. PostgreSQL integration tests run only when `DATABASE_URL_TEST` is configured with a disposable database whose name ends in `_test`; the test runner refuses other database names. CI provisions a fresh PostgreSQL service and runs both adapters.

## Optional authentication and authorization

An opt-in reference implementation lives under `examples/auth`. It provides opaque server-side sessions, a SQLite `SessionStore`, secure cookie helpers, synchronizer CSRF and strict Origin validation, server-side permission checks, and an OIDC identity adapter keyed by `(issuer, subject)`. It does not add dependencies to the default workspace. OIDC protocol integration uses the optional `openid-client` v6 client only when an application chooses a provider; see `examples/auth/README.md` for the Authorization Code + PKCE integration boundary and deployment requirements.

Run `bun run test:auth-examples` to test the session, cookie middleware, CSRF, OIDC identity boundary, SQLite store, and RBAC behavior.

## Optional API request safety

`examples/request-safety` contains route-scoped fixed-window rate limiting and request-deadline middleware. The limiter uses a bounded in-memory store for one Bun process and a pluggable `RateLimitStore` contract for a future Redis/Valkey implementation. Its key selector is explicit; authenticated routes should use a server-side user ID, while IP-based policies must use a trusted socket/proxy identity—not arbitrary `X-Forwarded-For` input.

The request-deadline middleware returns 504 and exposes an `AbortSignal` to downstream handlers. Pass that signal into cancellable `fetch` or driver operations; JavaScript cannot forcibly terminate work that ignores cancellation. Do not apply request deadlines to SSE or WebSocket routes.

Run `bun run test:request-safety` to run its strict type check and Bun tests. No new runtime dependency or service is added to the default workspace.

## Icon system

The web app uses `unplugin-icons` with Iconify collections. Lucide is the default icon style. Import icons as Svelte components with `~icons/{collection}/{icon}`; they are resolved at build time, so only the icons imported by the app are included in the bundle.

```svelte
<script lang="ts">
  import HouseIcon from '~icons/lucide/house'
</script>

<HouseIcon class="size-5" aria-hidden="true" />
```

Keep Lucide as the default visual language. Add another Iconify JSON collection package only when the product needs icons that Lucide does not provide; avoid mixing icon styles without a clear reason.

## CI/CD

GitHub Actions runs on pushes to `main`, pull requests targeting `main`, and manual dispatch:

1. **Quality gates:** Prettier, Bun dependency audit, ESLint, TypeScript/Svelte diagnostics, unit tests with line/function coverage, and production build.
2. **Browser E2E:** installs Chromium and tests the production Bun server.
3. **Database examples:** runs isolated SQLite tests and PostgreSQL integration tests against a fresh PostgreSQL 18.6 service.
4. **Authentication examples:** tests server-side sessions, CSRF checks, SQLite session persistence, OIDC identity mapping, and RBAC.
5. **API request safety examples:** tests fixed-window rate limits, trusted key selection, bounded-store failure, timeout responses, abort signals, and cleanup.
6. **Production delivery:** after quality, browser, database, authentication, and request-safety jobs pass on `main`, creates a deployable tarball containing the Hono server source, shared contracts, and built SPA.
7. **Dependency review:** checks pull-request dependency changes against GitHub's advisory data.
8. **CodeQL:** analyzes JavaScript/TypeScript on pushes, pull requests, and a weekly schedule.

Coverage text summaries are printed by CI and LCOV reports are uploaded as the `unit-test-coverage-<run>` artifact. Bun enforces a per-file minimum of 80% line coverage and 90% function coverage. The first measured baseline is 96.21% lines and 100% functions for the API workspace (84.85% lines in `app.ts`), and 100% for both metrics in the contracts workspace.

Download the `honvelte-wind-production-<commit>` artifact from the successful workflow run. The archive includes deployment instructions. This is a delivery artifact; an actual hosting deployment needs a configured hosting target and credentials.

Playwright reports and traces are uploaded even when E2E fails.

## Dependency and supply-chain policy

- Bun is pinned to 1.4.4 so local development and CI use the same runtime.
- `bunfig.toml` enforces a three-day npm release-age cooldown. This reduces exposure to newly published malicious or compromised package versions while allowing routine updates after the cooldown.
- The upstream `deepmerge@4.3.1` has no official patched release for GHSA-gcqx-w48m-w2h4. The Svelte Vite plugin uses it only in its build/configuration toolchain, so the repository temporarily overrides it with the reviewed `@oss-cve-patches/deepmerge@4.3.2` fork, which rejects `__proto__` keys and includes regression tests. Remove this override when the Svelte plugin ships its own replacement or the upstream package publishes a maintained fix; review the fork before every refresh.
- `bun audit --audit-level=low` is part of `bun run verify` and blocks all known low, moderate, high, and critical advisories in the resolved dependency tree.
- Dependabot checks Bun packages and GitHub Actions weekly. Routine minor/patch updates are grouped by toolchain; major upgrades remain separate for compatibility review.
- GitHub Actions are pinned to full commit SHAs.
- `bun.lock` is committed and every CI install uses `bun install --frozen-lockfile`, so audits and tests operate on the same reproducible dependency graph.

GitHub Dependabot supports Bun 1.4 and the current text-based `bun.lock` format; the legacy binary `bun.lockb` format is not supported. This repository pins Bun 1.4.4 and commits `bun.lock`, so the configured `bun` ecosystem is supported for version updates and dependency-graph analysis. Keep `bun audit` in CI as an independent check, not as a replacement for GitHub alerts. See [supported ecosystems](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories) and the [Bun 1.4 support announcement](https://github.blog/changelog/2026-10-20-dependabot-now-supports-npm-12-pnpm-11-and-12-and-bun-1-4/).

Repository security settings are enabled: dependency graph, automatic dependency submission, Dependabot alerts, malware alerts, Dependabot security updates, private vulnerability reporting, and secret protection. Dependabot version updates remain separately configured through `.github/dependabot.yml`.

## Runtime lifecycle and limits

The Bun server exposes separate process liveness and traffic readiness probes:

- `GET /api/health` is a liveness endpoint. It returns `200` while the application process can serve the probe.
- `GET /api/ready` returns `200` while the server is accepting application traffic and `503` after shutdown begins.

The base starter has no mandatory external runtime dependencies. Readiness therefore reports the server lifecycle only; it does not claim that optional database, identity-provider, or other example integrations are reachable. Add explicit dependency checks when an application makes an external service mandatory.

The Bun HTTP server limits are validated at startup and configurable through environment variables:

| Variable                        | Default   | Allowed range | Purpose                                                                           |
| ------------------------------- | --------: | ------------: | --------------------------------------------------------------------------------- |
| `SERVER_IDLE_TIMEOUT_SECONDS`   |      `30` |         1–255 | Connection inactivity timeout in seconds.                                         |
| `SERVER_MAX_REQUEST_BODY_BYTES` | `1048576` |  1 KiB–10 MiB | Maximum body size accepted by Bun.                                                |
| `SHUTDOWN_READINESS_DELAY_MS`   |    `1000` |       0–30000 | Delay before stopping the listener so load balancers can observe readiness=false. |
| `SHUTDOWN_TIMEOUT_MS`           |   `15000` |    100–120000 | Grace period before active connections are force-closed.                          |

The global Bun body limit is an outer transport limit. The existing greeting JSON parser keeps its stricter 1 KiB application-level limit. Increase either limit only for a concrete endpoint requirement, and continue streaming or bounding large uploads instead of buffering arbitrary payloads in memory.

On `SIGINT` or `SIGTERM`, the server marks readiness false and rejects new application requests with `503 SERVICE_UNAVAILABLE`. It then waits `SHUTDOWN_READINESS_DELAY_MS` (1 second by default) so a load balancer can observe the failed readiness probe before Bun stops accepting connections. Bun's `server.stop()` then lets in-flight HTTP work finish. If the configured grace period expires, it calls `server.stop(true)` to close remaining active connections. Requests still running at that point can be interrupted; keep the deployment platform's termination grace period longer than `SHUTDOWN_TIMEOUT_MS` plus `SHUTDOWN_READINESS_DELAY_MS` and a small process-exit margin.

Bun's idle timeout also applies to quiet periods during streaming responses. The starter does not currently expose SSE or WebSocket routes; when adding long-lived streams, configure their transport timeout deliberately rather than globally disabling connection timeouts. See the [Bun HTTP server lifecycle and timeout documentation](https://bun.com/docs/runtime/http/server).

For reverse-proxy deployments, terminate TLS at the proxy and trust forwarded headers only from ingress infrastructure that strips client-supplied forwarding headers and writes canonical values. Keep proxy connection, body, and upstream timeouts consistent with the application limits.

## Production

```bash
bun install --production
NODE_ENV=production HOST=0.0.0.0 PORT=3000 bun run start
```

For a reverse-proxy deployment, terminate TLS at the proxy and restrict forwarded headers to trusted proxy infrastructure.

## Testing

Run `bun run test` for quick unit-test feedback. Run `bun run test:coverage` to generate line/function text summaries and LCOV reports for API and shared contracts. The reports are written under `coverage/api` and `coverage/contracts`. Bun enforces at least 80% line coverage and 90% function coverage for each measured source file; this is a regression guard, not a substitute for meaningful assertions or integration coverage.

Install Chromium once:

```bash
bun run test:e2e:install
```

Run `bun run format` to apply Prettier when changing formatting. `bun run verify` includes `format:check`, coverage reporting, audit, lint, typecheck, unit tests, and build; run `bun run verify:all` before submitting a change. E2E config starts a production build and Bun server, then exercises SPA rendering, API calls, form validation, keyboard navigation, and API route behavior. axe-core scans the initial, validation, and success UI states.

## Manual accessibility review

Automated Playwright and axe-core checks are regression safeguards, not a substitute for manual assistive-technology testing. Before a release, follow the [manual accessibility review checklist](docs/testing/accessibility-manual-checklist.md) and record the commit, browser, operating system, screen reader, and actual results. Passing CI does not imply that manual review has been completed.

## Agent instructions and skills

Read `AGENTS.md` before making changes. Skills under `.agents/skills/` are the canonical sources:

- `project-development`: implementation and architecture rules.
- `testing`: unit, integration, contract, and regression tests.
- `playwright-e2e`: browser automation and E2E workflow.

Agent-specific instruction files point back to `AGENTS.md`. For Claude Code, generated skill aliases can be refreshed with `bun run agents:sync:claude`.

## Design decisions

- No database driver, ORM, auth provider, Redis, or queue is installed in the default workspace; optional database examples live under `examples/databases`.
- No Docker requirement.
- Same-origin API/static hosting avoids default CORS configuration.
- Runtime input validation uses Zod; TypeScript types alone do not validate network payloads.
- Keep secrets in server environment only. Never expose them through Vite `VITE_*` variables.

## Repository governance

The active repository ruleset **Protect main** targets `refs/heads/main`. It requires pull requests and the status checks `Quality gates`, `Browser E2E`, `Analyze JavaScript and TypeScript`, and `Review dependency changes`; it also requires the branch to be up to date and blocks force pushes and deletion. Its bypass list is empty, and the required approval count is zero to support the current single-maintainer workflow. Review the approval requirement if the maintainer team grows.

Repository-level dependency graph, automatic dependency submission, Dependabot alerts, malware alerts, Dependabot security updates, private vulnerability reporting, and secret protection are enabled. These controls are separate from the weekly Bun and GitHub Actions version updates configured in `.github/dependabot.yml`.
