# UI System and Documentation Platform — Execution Checkpoint

> Status: **Proposed / not implemented**
> Checkpoint created: 2026-11-01
> Baseline `main` commit when this checkpoint was prepared: `4777f96208ae90fc5c8104dbeddd8e86629f334a`
> Product direction: opinionated, modular full-stack **web starter**. Do not describe this repository as a universal starter for unrelated development domains.

This document is the durable source of truth for the proposed shadcn-svelte integration and documentation platform. It exists so work can resume in a new chat or by another contributor without relying on chat history.

## 1. Current repository baseline

The following are existing implementation facts at the checkpoint baseline:

- Bun 1.4.4 workspaces, with root workspaces matching `apps/*` and `packages/*`.
- `apps/web`: Svelte 5 + Vite 8 + Tailwind CSS 4.
- `apps/api`: Hono API, Bun runtime entry point, and Cloudflare Workers Fetch adapter.
- `packages/contracts`: shared Zod 4 schemas and typed contracts.
- Existing UI primitives live in `apps/web/src/lib/components/ui/` (`Button.svelte`, `TextField.svelte`).
- Existing feature-owned UI lives under `apps/web/src/features/`.
- The web project currently uses `unplugin-icons` with the Lucide Iconify collection.
- Existing automated tests use **Bun Test** and Playwright, not Vitest.
- The API has health/readiness, greeting, and optional metrics routes. The Prometheus route is `/api/metrics`, not `/metrics`.
- `wrangler.jsonc` routes `/api/*` through the Worker first; other static requests can use SPA fallback.
- Root `docs/` already contains internal/testing documentation, including `docs/testing/accessibility-manual-checklist.md`. That manual checklist is documented but has not yet been completed.

### Deployment and quality status at checkpoint

- PR #31, which added and tested `robots.txt`, is merged.
- Main commit: `4777f96208ae90fc5c8104dbeddd8e86629f334a`.
- Main CI and CodeQL passed on that commit.
- Staging deployment run #41275259877 passed.
- Production deployment run #41275741903 passed.
- Live deployment checks verified health, SPA, greeting API, JavaScript/CSS assets, and `robots.txt`.
- User-provided PageSpeed screenshots showed mobile and desktop scores of 100 for Performance, Accessibility, Best Practices, and SEO. Agentic Optimization was 2/4. These are Lighthouse lab results; CrUX field data was not available.

The documentation and UI tools below have **not** been installed or integrated as of this checkpoint.

## 2. Target architecture and decisions

### 2.1 shadcn-svelte — UI source and component system

**Decision:** Adopt shadcn-svelte as the source-code component foundation for the existing Svelte 5 + Tailwind CSS 4 application.

Rules:

1. Keep `apps/web/src/lib/components/ui/` as the canonical location for shared UI primitives.
2. Do not create a second parallel component system. Migrate or adapt the existing Button and TextField rather than keeping duplicate implementations.
3. Keep component source code owned by this repository; add components selectively through the shadcn-svelte CLI.
4. Preserve accessibility semantics, labels, keyboard behavior, visible focus, disabled/busy states, and reduced-motion behavior.
5. Keep current design tokens coherent with shadcn-svelte CSS variables and Tailwind CSS 4. Do not introduce a second unrelated theme.
6. Resolve the icon strategy before broad component migration. Current baseline is `unplugin-icons` + Lucide Iconify. Avoid adding a second icon package solely by accident; either retain the existing abstraction where compatible or document and test an intentional migration.
7. Use the **Vite** installation path, not SvelteKit-specific setup. Verify aliases, `components.json`, Tailwind v4 CSS configuration, and generated component imports against the repository's actual build.

Initial component coverage should focus on Button, Input/TextField, Label, Textarea, Checkbox, Switch, Select, Card, Alert, Dialog, Dropdown Menu, Sheet, Tabs, Tooltip, Table, and Skeleton. This is a candidate catalog, not a requirement to install every component immediately.

### 2.2 Main documentation — Astro Starlight

**Decision:** Use Astro Starlight for the public documentation website.

**Repository placement:** Prefer `apps/docs/`, not a standalone root-level `docs-site/`, because the existing Bun workspace glob already includes `apps/*`. Keep the existing root `docs/` for operational/testing documents and checklists.

Starlight content sections:

- Getting started: overview, requirements, installation, quick start, workspace commands.
- Architecture: monorepo boundaries, feature modules, contract-driven design, client/server boundary, error handling.
- Backend: Hono route structure, Zod contracts, request IDs, logging, metrics, lifecycle, Bun vs Worker runtime differences.
- Frontend: Svelte 5 runes, feature ownership, Tailwind tokens, shadcn-svelte component conventions, API client.
- Components: install, customize, compose, test, and accessibility expectations.
- Examples/recipes: authentication and sessions, SQLite/PostgreSQL, request safety, background jobs, Cloudflare adapters.
- Operations: testing, accessibility, security, staging/production deployment, rollback, troubleshooting.
- Contributing: branch/PR workflow, quality gates, dependency policy, and release process.

Deploy the documentation site independently to Cloudflare Pages. Do not couple documentation deployment to the production Worker deployment.

### 2.3 Interactive REST API reference — Hono OpenAPI + Scalar

**Decision:** Generate OpenAPI from the existing runtime schemas and serve Scalar as an API reference.

Proposed Worker-compatible routes:

- `GET /api/openapi.json` — machine-readable OpenAPI document.
- `GET /api/docs` — Scalar UI.

Implementation constraints:

1. Reuse schemas from `packages/contracts`; do not define a second DTO model just for documentation.
2. Preserve the existing Hono route behavior and API error envelope.
3. Verify compatibility of `@hono/zod-openapi` with the currently installed Zod major version and Hono version **before** adding dependencies. Do not downgrade Zod or duplicate schemas to force integration.
4. Preserve the 1 KiB streamed request-body limit and all current validation/error behavior. OpenAPI validation must not bypass the existing body parser or request-safety rules.
5. Keep both endpoints under `/api/*` so Wrangler's current `run_worker_first` routing sends them to Hono rather than the SPA fallback.
6. Add tests for the OpenAPI document, expected paths/operations, schema reuse, Scalar response, and both Bun and Cloudflare Worker runtimes.
7. Document that the live Scalar playground targets the configured API environment; do not expose secrets or assume authenticated endpoints are safe to execute anonymously.

### 2.4 Component playground — Histoire

**Decision:** Evaluate Histoire with `@histoire/plugin-svelte` as the isolated component playground.

- Use a dedicated Histoire configuration and scripts; do not inject Histoire plugins into the production Vite plugin list.
- Place stories next to components or in a clearly documented stories directory.
- Provide representative stories for default, variant, disabled, loading, validation/error, keyboard, and responsive states.
- Use it for visual/interaction exploration, not as the only source of component API documentation.
- Before adoption, verify compatibility with the repository's Vite 8 and Svelte/Vite-plugin versions. If the maintained Histoire release cannot support the pinned stack reliably, evaluate Storybook rather than downgrading the application toolchain.

### 2.5 TypeScript reference — TypeDoc

**Decision:** TypeDoc is optional and limited to useful exported TypeScript APIs with JSDoc.

- It must not replace OpenAPI for HTTP request/response documentation.
- Avoid generating noisy internal symbols or implementation details.
- Generate only from explicitly selected public entry points in `packages/contracts` and any future public utility packages.
- Add it only when generated output provides real value beyond the Starlight guides.

## 3. Execution phases and acceptance criteria

Work sequentially. Do not install all tools in one change.

### Phase 0 — Compatibility and architecture preflight

- Inspect `AGENTS.md`, current package manifests, Vite/Tailwind configuration, TypeScript aliases, and existing UI tests.
- Check current stable versions and peer compatibility for shadcn-svelte, Astro Starlight, Scalar, `@hono/zod-openapi`, Histoire, and TypeDoc against Bun 1.4.4, Svelte 5, Vite 8, Tailwind 4, Hono, and Zod 4.
- Record decisions and pinned versions in the PR. Do not assume package names/versions from old examples.
- Confirm deployment/runtime boundaries before adding any endpoint or tool.

**Exit criteria:** compatibility matrix and integration choices documented; no dependency installed solely on assumption.

### Phase 1 — shadcn-svelte foundation

- Install/configure shadcn-svelte using its Vite + Tailwind v4 path.
- Establish aliases and `components.json`.
- Align CSS variables and theme tokens with the existing design system.
- Migrate existing Button and TextField to the chosen component conventions without regressing their public props or accessibility behavior.
- Decide and document the icon strategy.
- Add a small representative set of components only.

**Exit criteria:** build, Svelte checks, Playwright, axe-core, keyboard interaction tests, and mobile layout checks pass; no duplicate Button/TextField implementations remain.

### Phase 2 — OpenAPI and Scalar

- Integrate OpenAPI generation with shared Zod schemas.
- Add `/api/openapi.json` and `/api/docs`.
- Verify Bun and local `workerd` responses.
- Add API contract tests and live deployment smoke checks.
- Confirm body limits, API errors, CORS assumptions, and security boundaries are unchanged.

**Exit criteria:** spec accurately represents the running API; Scalar works in staging; Worker routing does not return SPA HTML for either endpoint.

### Phase 3 — Histoire component playground

- Add isolated Histoire setup and Svelte stories.
- Cover component variants, states, accessibility, and responsive behavior.
- Keep Histoire build/dev tooling out of the production application bundle.

**Exit criteria:** component stories run and build in CI against the pinned Vite/Svelte versions.

### Phase 4 — Starlight documentation application

- Add `apps/docs` as a Bun workspace.
- Build the navigation and information architecture described above.
- Write installation, architecture, API, UI, examples, testing, security, and deployment guides from the actual repository implementation.
- Link to the root manual accessibility checklist rather than duplicating it.
- Add Scalar and component-playground links where available.

**Exit criteria:** docs build cleanly, commands are verified against a clean checkout, internal links work, and no guide describes unimplemented behavior as available.

### Phase 5 — Generated references

- Add TypeDoc only for selected public TypeScript exports when needed.
- Publish/link generated reference output from Starlight.
- Keep OpenAPI as the HTTP contract reference.

**Exit criteria:** generated output is deterministic, useful, and free of internal implementation noise.

### Phase 6 — CI/CD and documentation delivery

- Add `docs:dev`, `docs:build`, and `docs:check` scripts.
- CI should build docs, validate internal links, validate OpenAPI generation, build/check the component playground, and fail on broken local references.
- External-link checking should avoid flaky network-dependent failures or use a controlled/retry policy.
- Deploy `apps/docs` independently to Cloudflare Pages with a separate workflow and environment.
- Preserve the existing Cloudflare Worker deploy/rollback workflows; documentation deployment must not share production Worker credentials or mutate Worker configuration.

**Exit criteria:** pull requests validate documentation and component references; docs can deploy independently; a failed docs deployment cannot affect the application Worker.

## 4. Accuracy corrections to the original proposal

Use actual repository tooling and paths in documentation:

| Incorrect or ambiguous description         | Repository truth                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| Vitest                                     | Bun Test (`bun test`)                                                              |
| Prometheus endpoint `/metrics`             | `/api/metrics`                                                                     |
| SvelteKit setup instructions               | Svelte + Vite setup                                                                |
| A new DTO set for OpenAPI                  | Reuse `packages/contracts` Zod schemas                                             |
| Root `docs/` as the Starlight app          | Keep root `docs/` for existing checklists; use `apps/docs/` workspace              |
| Histoire plugin in production Vite plugins | Dedicated Histoire configuration                                                   |
| Cloudflare Worker handles every route      | `/api/*` runs through Worker; static assets use Workers Static Assets/SPA fallback |

The default Worker profile does not automatically support Bun-specific modules or process-local facilities. Clearly distinguish Bun runtime examples from Cloudflare Worker-compatible examples.

## 5. Non-goals and guardrails

- Do not turn the default starter into a bundle of every UI component or every infrastructure service.
- Do not add Histoire, TypeDoc, Scalar, and Starlight to the production browser bundle.
- Do not downgrade core dependencies to accommodate an unmaintained documentation tool.
- Do not duplicate Zod DTOs or introduce a second design-token system.
- Do not claim SSR, mobile, desktop, CLI, data engineering, or game-development support as completed profiles.
- Do not deploy changes to production before CI and staging verification.
- Do not treat Lighthouse lab scores as real-user CrUX data. Preserve the current measured baseline, but re-run PSI after material UI/runtime changes.

## 6. Resume instructions for a new session

Before modifying the repository:

1. Fetch the current `main` and read `AGENTS.md`, `roadmap.md`, this checkpoint, and the relevant package/config files.
2. Check open PRs and recent CI status. Do not assume this checkpoint branch or baseline commit is still current.
3. Treat every phase above as planned until the current repository proves it is implemented.
4. Resume with **Phase 0 — Compatibility and architecture preflight**, then implement only Phase 1 in its own PR.
5. Update this checkpoint and `roadmap.md` after each completed phase with PR number, merge commit, test results, and deployment status.
6. Never mark a phase complete based only on files existing; require its acceptance criteria and CI evidence.

Suggested first task: perform Phase 0 compatibility research and report a compatibility matrix for shadcn-svelte + Svelte 5 + Vite 8 + Tailwind CSS 4, then prepare a narrowly scoped shadcn-svelte integration PR. Do not start Scalar, Histoire, Starlight, or TypeDoc in that same PR.
