# Honvelte Wind

A full-stack starter built with Svelte 5 + Vite SPA, Hono, Tailwind CSS 4, TypeScript, and Bun Workspaces. Production is served by one Bun process: Hono handles API routes and serves the built SPA.

## Requirements

- Bun version pinned in `.bun-version`
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

| Command | Description |
| --- | --- |
| `bun run dev` | Run API and Vite concurrently |
| `bun run build` | Build contracts and SPA |
| `bun run start` | Serve API + static SPA with Bun |
| `bun run check` | TypeScript and Svelte diagnostics |
| `bun run lint` | ESLint |
| `bun run test` | API and contracts unit tests |
| `bun run test:e2e` | Playwright browser tests |
| `bun run verify` | Lint, typecheck, unit tests, and production build |
| `bun run verify:all` | All verification including E2E |

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

1. **Quality gates:** ESLint, TypeScript/Svelte diagnostics, unit tests, and production build.
2. **Browser E2E:** installs Chromium and tests the production Bun server.
3. **Production delivery:** after both jobs pass on `main`, creates a deployable tarball containing the Hono server source, shared contracts, and built SPA.

Formatting is available through `bun run format:check`, but is not currently a blocking part of `bun run verify`. This is tracked as a P0 item in the roadmap.

The repository does not currently commit `bun.lock`. CI temporarily falls back to `bun install` when the lockfile is absent, so dependency resolution is not yet fully reproducible. Committing the lockfile and switching every job to frozen installs is also a P0 roadmap item.

Download the `honvelte-wind-production-<commit>` artifact from the successful workflow run. The archive includes deployment instructions. This is a delivery artifact; an actual hosting deployment needs a configured hosting target and credentials.

Playwright reports and traces are uploaded even when E2E fails. A separate CodeQL workflow analyzes JavaScript/TypeScript on pushes, pull requests, and a weekly schedule. Dependabot checks Bun dependencies and GitHub Actions weekly; the workflow references are pinned to commit SHAs.

See [SECURITY.md](./SECURITY.md) for vulnerability reporting instructions.

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

Run `bun run format:check` to check formatting and `bun run format` to apply Prettier. Then run `bun run verify:all`. E2E config starts a production build and Bun server, then exercises SPA rendering, API calls, form validation, and API route behavior.

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
