# Agent instructions

You are working in Honvelte Wind, a Svelte 5 + Vite SPA, Hono API, Tailwind CSS 4, and Bun Workspaces repository.

## Required workflow

1. Inspect the relevant app/package and existing conventions before editing.
2. Read the matching local skill in `.agents/skills/` when the task involves implementation, testing, or browser E2E.
3. Make the smallest coherent change; do not add abstractions or dependencies without a concrete need.
4. Validate inputs at runtime with shared Zod schemas. TypeScript types do not validate network payloads.
5. Keep server-only secrets and modules out of browser bundles.
6. Add or update tests for behavior changes and regression fixes.
7. Run the narrowest relevant checks, then `bun run verify`; run `bun run test:e2e` for user-facing flows.
8. Report commands run and distinguish verified results from unexecuted checks.

## Architecture boundaries

- `apps/web`: browser UI and client-side routing. API calls use the same-origin `/api` path.
- `apps/api`: HTTP routes, middleware, application services, infrastructure, and Bun server entry.
- `packages/contracts`: dependency-light schemas and types safe to import from both apps.
- Do not import `apps/api` implementation modules into the browser app.
- Keep all API routes under `/api/*`; non-API paths belong to the SPA fallback.

## Quality and security

- TypeScript strict mode is mandatory.
- Validate environment variables at startup.
- Use explicit status codes and stable error response shapes.
- Never log passwords, tokens, cookies, authorization headers, or secret environment values.
- Avoid permissive CORS for same-origin deployment.
- Treat user-provided content as untrusted; escape/render it safely.
- Do not weaken tests, lint rules, or CI to make a change pass.

## Commands

- Development: `bun run dev`
- Unit/integration: `bun run test`
- E2E: `bun run test:e2e`
- Verification: `bun run verify` and `bun run verify:all`

## Task-specific skills

- Implementation/refactoring: `.agents/skills/project-development/SKILL.md`
- Tests and regression: `.agents/skills/testing/SKILL.md`
- Browser journeys: `.agents/skills/playwright-e2e/SKILL.md`
