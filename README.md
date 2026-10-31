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

| Command              | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `bun run dev`        | Run API and Vite concurrently                               |
| `bun run build`      | Build contracts and SPA                                     |
| `bun run start`      | Serve API + static SPA with Bun                             |
| `bun run check`      | TypeScript and Svelte diagnostics                           |
| `bun run lint`       | ESLint                                                      |\n| `bun run format:check` | Prettier formatting check                                 |
| `bun run audit`      | Audit locked dependencies for moderate-or-higher advisories |
| `bun run test`       | API and contracts unit tests                                |
| `bun run test:e2e`   | Playwright browser tests                                    |
| `bun run verify`     | Prettier, audit, lint, typecheck, unit tests, and build     |
| `bun run verify:all` | All verification including E2E                              |

## Architecture

- `apps/web`: Svelte 5 SPA, Vite, Tailwind CSS 4.
- `apps/api`: Hono app and Bun production entry point.
- `packages/contracts`: Zod schemas and shared API contracts.
- `.agents/skills`: canonical Agent Skills source.
- `AGENTS.md`: repository-wide instructions for coding agents.

The web app calls `/api` through Vite proxy in development. In production Hono serves `apps/web/dist` and handles SPA fallback. Keep API routes under `/api/*`.

See [roadmap.md](./roadmap.md) for the engineering priorities, acceptance criteria, and planned project profiles.

## CI/CD

GitHub Actions runs on pushes to `main`, pull requests targeting `main`, and manual dispatch:

1. **Quality gates:** Prettier, Bun dependency audit, ESLint, TypeScript/Svelte diagnostics, unit tests, and production build.
2. **Browser E2E:** installs Chromium and tests the production Bun server.
3. **Production delivery:** after both jobs pass on `main`, creates a deployable tarball containing the Hono server source, shared contracts, and built SPA.
4. **Dependency review:** checks pull-request dependency changes against GitHub's advisory data.
5. **CodeQL:** analyzes JavaScript/TypeScript on pushes, pull requests, and a weekly schedule.

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

GitHub's dependency graph currently does not list Bun as a supported lockfile ecosystem. The local/CI `bun audit` therefore remains the source of truth for vulnerabilities in Bun's resolved dependency tree; the dependency-review workflow is an additional check, not a replacement.

## Production

```bash
bun install --production
NODE_ENV=production HOST=0.0.0.0 PORT=3000 bun run start
```

For a reverse-proxy deployment, terminate TLS at the proxy and restrict forwarded headers to trusted proxy infrastructure.

## Testing

Install Chromium once:

```bash
bun run test:e2e:install
```

Run `bun run format` to apply Prettier when changing formatting. `bun run verify` now includes `format:check`; run `bun run verify:all` before submitting a change. E2E config starts a production build and Bun server, then exercises SPA rendering, API calls, form validation, and API route behavior.

## Agent instructions and skills

Read `AGENTS.md` before making changes. Skills under `.agents/skills` are the canonical sources:

- `project-development`: implementation and architecture rules.
- `testing`: unit, integration, contract, and regression tests.
- `playwright-e2e`: browser automation and E2E workflow.

Agent-specific instruction files point back to `AGENTS.md`. For Claude Code, generated skill aliases can be refreshed with `bun run agents:sync:claude`.

## Design decisions

- No database, ORM, auth provider, Redis, or queue is installed by default.
- No Docker requirement.
- Same-origin API/static hosting avoids default CORS configuration.
- Runtime input validation uses Zod; TypeScript types alone are not runtime validation.
- Keep secrets in server environment only. Never expose them through Vite `VITE_*` variables.

## Repository governance

The repository has not yet been configured with a ruleset for `main`. Before treating it as protected, create a branch ruleset targeting `main` with these requirements:

- Require pull requests before merging.
- Require the status checks `Quality gates`, `Browser E2E`, `Analyze JavaScript and TypeScript`, and `Review dependency changes`.
- Block force pushes and branch deletion; do not configure a bypass for routine contributors.

Enable Dependabot alerts and Dependabot security updates under **Settings → Security and quality → Code security and analysis**. These are repository security settings, separate from Dependabot version updates in `.github/dependabot.yml`.
