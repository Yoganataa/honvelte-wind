# Honvelte Wind

A full-stack starter built with Svelte 5 + Vite SPA, Hono, Tailwind CSS 4, TypeScript, and Bun Workspaces. Production is served by one Bun process: Hono handles API routes and serves the built SPA.

## Requirements

- Bun 1.3+ (use the version pinned in `.bun-version`)
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
| `bun run verify` | Lint, format check, check, unit tests, build |
| `bun run verify:all` | All verification including E2E |

## Architecture

- `apps/web`: Svelte 5 SPA, Vite, Tailwind CSS 4.
- `apps/api`: Hono app and Bun production entry point.
- `packages/contracts`: Zod schemas and shared API contracts.
- `.agents/skills`: canonical Agent Skills source.
- `AGENTS.md`: repository-wide instructions for coding agents.

The web app calls `/api` through Vite proxy in development. In production Hono serves `apps/web/dist` and handles SPA fallback. Keep API routes under `/api/*`.

## Production

```bash
bun install --frozen-lockfile
bun run build
NODE_ENV=production bun run start
```

Set `PORT` and `HOST` as needed. The API process serves static assets from `apps/web/dist`. For deployment behind a reverse proxy, terminate TLS at the proxy and restrict forwarded headers to trusted proxy infrastructure.

## Testing

Install Chromium once:

```bash
bun run test:e2e:install
```

Then run `bun run verify:all`. E2E config starts a production build and the Bun server, then exercises SPA rendering, API calls, form validation, API errors, and route fallback.

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
