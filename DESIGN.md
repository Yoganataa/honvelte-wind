# Design System

> Status: **Current baseline documented; component-library integration is planned**
> Scope: Svelte 5 + Vite + Tailwind CSS 4 application in `apps/web`.

This document records the design language that currently exists in the repository and the rules for extending it. It is the source of truth for design decisions; implementation remains in `apps/web/src/app.css` and the shared UI components.

## 1. Design principles

1. **Clarity before decoration.** Prefer hierarchy, readable copy, and meaningful spacing over ornamental effects.
2. **Consistent tokens.** Use the semantic colors defined in `app.css`; do not scatter unrelated hard-coded colors across features.
3. **Accessible by default.** Use native semantics, explicit labels, visible focus, keyboard-operable controls, and meaningful error/status announcements.
4. **Responsive by construction.** Components must remain usable from the 320 px minimum viewport upward; avoid fixed-width controls that break narrow layouts.
5. **Motion is optional.** Respect `prefers-reduced-motion` and do not make animation necessary to understand state.
6. **Feature ownership.** Feature-specific presentation belongs with its feature; reusable primitives belong in `src/lib/components/ui`.
7. **Small, composable UI.** Add shared primitives when more than one feature needs them or when a consistent interaction contract is valuable.

## 2. Current visual direction

The current application is dark-first. Its base surface is near-black, with raised dark panels, high-contrast foreground text, muted supporting copy, and cyan as the primary interactive accent. Success and danger use semantic green and red tones.

The current design is intentionally restrained: a centered content column, a clear page heading, one primary interactive panel, and supporting feature cards. New screens should preserve this hierarchy unless a product requirement justifies a different layout.

## 3. Design tokens

The canonical tokens are declared in `apps/web/src/app.css` under Tailwind CSS 4's `@theme` block.

| Token            | Current value | Intended use                             |
| ---------------- | ------------- | ---------------------------------------- |
| `canvas`         | `#09090b`     | Application background and input surface |
| `foreground`     | `#f4f4f5`     | Primary text                             |
| `muted`          | `#a1a1aa`     | Secondary text and placeholders          |
| `panel`          | `#18181b`     | Cards and raised surfaces                |
| `panel-muted`    | `#1c1c20`     | Secondary raised surfaces                |
| `border`         | `#3f3f46`     | Dividers and control borders             |
| `accent`         | `#67e8f9`     | Primary actions and focus indication     |
| `accent-hover`   | `#a5f3fc`     | Hover state for primary actions          |
| `danger`         | `#fca5a5`     | Error text                               |
| `danger-panel`   | `#450a0a`     | Error surface                            |
| `danger-border`  | `#7f1d1d`     | Error boundary                           |
| `success`        | `#6ee7b7`     | Success text and indicators              |
| `success-panel`  | `#022c22`     | Success surface                          |
| `success-border` | `#065f46`     | Success boundary                         |

Use semantic utilities such as `bg-canvas`, `text-foreground`, `text-muted`, `bg-panel`, `border-border`, and `bg-accent`. If a new semantic color is needed, add a token to `app.css` and document its role here rather than inventing a feature-local palette.

The current theme declares `color-scheme: dark`. Do not imply that a light theme exists until it has been designed and tested.

## 4. Typography

The root font stack is:

```css
Inter, ui-sans-serif, system-ui, sans-serif
```

The current root styles disable synthetic font faces, enable text antialiasing, and use optimized text rendering. Use a clear hierarchy:

- Page title: strong, compact, and responsive.
- Section title: distinguishable from body copy without excessive size.
- Supporting copy: use the muted semantic color.
- Labels: remain visible and associated with their input; do not rely on placeholder text as a label.
- Error and status text: be concise and programmatically associated with the affected control or live region.

Do not introduce a second font family without a documented product reason and a performance/accessibility review.

## 5. Layout and spacing

The current starter page uses a centered content column with a maximum width of `48rem` (`max-w-3xl`), horizontal page padding, generous vertical breathing room, and a vertical content gap.

Guidelines:

- Prefer a centered, readable content measure for forms and explanatory content.
- Use responsive Tailwind utilities rather than viewport-specific fixed dimensions.
- Keep interactive controls at least 44 px high where practical; the current Button and TextField use Tailwind's `min-h-11`.
- Preserve a minimum supported viewport width of 320 px.
- Use panel surfaces to establish grouping; do not add nested cards without a clear information hierarchy.
- Keep form labels, fields, actions, and feedback visually grouped.

The values above document the current implementation, not a requirement that every future screen use the exact same page layout.

## 6. Shared UI components

The canonical shared component directory is:

```text
apps/web/src/lib/components/ui/
├── Button.svelte
└── TextField.svelte
```

### Button

Current contract:

- Accepts a Svelte 5 `Snippet` as children.
- Supports `button`, `submit`, and `reset` types.
- Supports `disabled` and `busy` states.
- A busy button is disabled and exposes `aria-busy="true"`.
- Uses the accent token, dark foreground text, rounded corners, and visible focus styling.

### TextField

Current contract:

- Requires a stable `id` and visible `label`.
- Supports placeholder, max length, autocomplete, disabled, bindable value, and an error message.
- Associates the label through `for`/input `id`.
- Associates the error through `aria-describedby` and exposes invalid state through `aria-invalid`.
- Keeps error feedback adjacent to the relevant input.

New shared components must document their public props, state behavior, semantics, keyboard interaction, and accessibility requirements. Avoid moving feature-only markup into the shared UI directory prematurely.

## 7. Interaction and accessibility requirements

- Use semantic HTML elements before custom roles.
- Every form field needs a persistent visible label.
- Keyboard users must have a visible `:focus-visible` indicator. The current global indicator is a 2 px accent outline with a 2 px offset.
- Disabled, busy, invalid, success, and error states must be perceivable without relying on color alone.
- Error text must be associated with its control; asynchronous success/error feedback should use an appropriate status or alert region.
- Preserve native keyboard behavior for buttons, inputs, dialogs, menus, and other interactive patterns.
- Honor the global `prefers-reduced-motion: reduce` rule.
- Run Playwright and axe-core checks for meaningful states, then complete the manual checklist in `docs/testing/accessibility-manual-checklist.md` before claiming manual accessibility verification.

Automated axe-core checks do not prove full WCAG conformance; manual keyboard, screen-reader, zoom/reflow, and contrast review remains required.

## 8. Icons

The current application uses `unplugin-icons` with the Lucide Iconify collection. Keep icon style consistent and use icons as supporting visual cues, not as the only label for an important action.

The proposed shadcn-svelte integration must make an explicit decision about whether to retain this icon pipeline or migrate to another Lucide package. Do not install a second icon system implicitly.

## 9. Planned shadcn-svelte integration

shadcn-svelte is a **planned** source-owned component foundation; it is not part of the current dependency set at this checkpoint.

When that phase begins:

- Preserve `apps/web/src/lib/components/ui` as the canonical component location.
- Align generated CSS variables with the tokens in this document.
- Migrate the existing Button and TextField rather than keeping duplicate primitives.
- Use its Svelte + Vite + Tailwind CSS 4 installation path; do not copy SvelteKit-only configuration into this Vite application.
- Add components selectively and keep source code owned by the repository.
- Retain accessibility and keyboard guarantees already present in the current components.
- Update this document only after implementation and tests demonstrate the actual behavior.

See `docs/roadmap/documentation-and-ui-platform.md` for the phased UI and documentation platform plan.

## 10. Change process

For a visual or interaction change:

1. Identify the affected token, primitive, feature, or page.
2. Prefer semantic tokens and existing shared components.
3. Add or update tests for interaction and accessibility regressions.
4. Check narrow viewport behavior and reduced-motion behavior.
5. Run the relevant Playwright/axe-core checks and `bun run verify`.
6. Update this document when a shared design rule or token changes.

A design change is not complete merely because it looks correct in one screenshot; it must also preserve the component contract, keyboard operation, responsive behavior, and accessible state communication.
