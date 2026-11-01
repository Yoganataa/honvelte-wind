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

- `apps/web`: page shell, feature-owned browser UI, and reusable UI primitives. Keep feature code in `src/features/<feature>` and only move genuinely shared primitives into `src/lib/components/ui`. API calls use the same-origin `/api` path; defer a router until multiple real routes require one.
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

## Naming and casing conventions

Follow the naming convention that matches the file's role; do not normalize ecosystem-mandated filenames.

- **Root governance documents:** use uppercase names with the conventional `.md` extension: `AGENTS.md`, `README.md`, `ROADMAP.md`, `DESIGN.md`, and `SECURITY.md`. Preserve tool-specific root files such as `CLAUDE.md` and `GEMINI.md`.
- **Nested topical documentation:** use `kebab-case.md` (for example, `accessibility-manual-checklist.md` and `documentation-and-ui-platform.md`). Use `README.md` for directory entry points and `SKILL.md` for Agent Skills entry points.
- **Directories and non-component source modules:** use lowercase `kebab-case` (for example, `request-safety/`, `http-metrics.ts`, and `error-handler.ts`).
- **Svelte component files and component names:** use `PascalCase.svelte` (for example, `Button.svelte`, `TextField.svelte`, and `GreetingPanel.svelte`).
- **TypeScript/JavaScript identifiers:** use `camelCase` for variables and functions; use `PascalCase` for types, interfaces, classes, and component types.
- **Environment variables:** use `SCREAMING_SNAKE_CASE` (for example, `CLOUDFLARE_API_TOKEN`).
- **CSS custom properties:** use the CSS-standard `--kebab-case` form.
- **Tests:** append `.test.ts` to unit-test module names and use `.spec.ts` for Playwright test files, following the existing test tooling.
- **Tool and ecosystem configuration:** retain the exact filename and casing required by the tool (for example, `vite.config.ts`, `wrangler.jsonc`, `components.json`, and `.prettierrc.json`).

For any new root-level documentation, first decide whether it is a governance/reference document (uppercase) or a topical guide (nested kebab-case). Avoid creating lowercase root variants such as `roadmap.md`.

## Commands

- Development: `bun run dev`
- Unit/integration: `bun run test`
- E2E: `bun run test:e2e`
- Verification: `bun run verify` and `bun run verify:all`

## Task-specific skills

- Implementation/refactoring: `.agents/skills/project-development/SKILL.md`
- Tests and regression: `.agents/skills/testing/SKILL.md`
- Browser journeys: `.agents/skills/playwright-e2e/SKILL.md`

<!-- antislop:start -->

## antislop

For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):

- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `antislop-copywriting`: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
  Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
  Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
  If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
  To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.

<!-- antislop:end -->
