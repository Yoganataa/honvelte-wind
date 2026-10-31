---
name: project-development
description: Implement and refactor features in this Svelte 5, Vite, Hono, Tailwind CSS 4, and Bun monorepo. Use for architecture, API, UI, dependency, or code-quality changes.
---

# Project development

1. Read root `AGENTS.md` and inspect the affected package before coding.
2. Keep browser code in `apps/web`, HTTP/server implementation in `apps/api`, and cross-runtime schemas/types in `packages/contracts`.
3. Use Svelte 5 runes for component state. Keep components focused and accessible.
4. Keep `App.svelte` as the page composition root; place feature-owned UI, state, and API calls in `src/features/<feature>`. Put only small, genuinely shared primitives in `src/lib/components/ui`.
5. Prefer native semantic HTML, visible labels, associated validation descriptions, keyboard-operable controls, visible focus indicators, and reduced-motion support. Avoid adding a router until multiple real routes require one.
6. Use Tailwind CSS 4 through `@tailwindcss/vite`; do not introduce legacy Tailwind v3 configuration.
7. Keep Hono endpoints under `/api/*`. Use explicit status codes and shared Zod validation for untrusted input.
8. Keep secrets out of Vite client variables and browser imports. Parse server environment at startup.
9. Prefer same-origin `/api`; Vite proxies it during development and Hono serves the SPA in production.
10. Avoid new dependencies unless they materially reduce complexity or provide required capabilities.
11. Add tests for behavior changes and run relevant checks plus `bun run verify`.
12. Report assumptions, changed behavior, commands executed, and any unverified areas.
