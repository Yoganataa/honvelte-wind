# Design System

> Status: **Warm Studio & Organic Clay baseline with shadcn-svelte component platform**
> Scope: Svelte 5 + Vite + Tailwind CSS 4 application in `apps/web`.

This document records the design language that exists in the repository and the rules for extending it. It is the source of truth for design decisions; implementation resides in `apps/web/src/app.css`, `apps/web/src/lib/components/ui`, and feature components.

## 1. Design principles

1. **Clarity before decoration.** Prefer hierarchy, readable copy, and meaningful spacing over ornamental effects.
2. **Consistent tokens.** Use the semantic colors defined in `app.css`; do not scatter unrelated hard-coded colors across features.
3. **Accessible by default.** Use native semantics, explicit labels, visible focus, keyboard-operable controls, and meaningful error/status announcements.
4. **Responsive by construction.** Components must remain usable from the 320 px minimum viewport upward; avoid fixed-width controls that break narrow layouts.
5. **Motion is optional.** Respect `prefers-reduced-motion` and do not make animation necessary to understand state.
6. **Feature ownership.** Feature-specific presentation belongs with its feature; reusable primitives belong in `src/lib/components/ui`.
7. **Small, composable UI.** Add shared primitives when more than one feature needs them or when a consistent interaction contract is valuable.

## 2. Visual direction and design patterns

The visual language follows the **Warm Studio & Organic Clay** design architecture, matching Google Stitch and modern craft UI patterns:

- **Brand Mark & Iconography:** A custom coral-to-flame squircle badge (`/logo.webp`) displaying a modern white "H" letterform interconnected with an organic golden ribbon wave. The mark features micro-tilt interaction on hover (`rotate(-8deg) scale(1.1)`).
- **Primary Light Baseline (Warm Linen & Espresso):** A warm, tactile, premium environment featuring a warm linen canvas (`#f4efe9`), subtle secondary clay surfaces (`#e9dfd5`), elevated pure white card panels (`#ffffff`), warm hairline borders (`#e8e1d9`), and rich espresso ink typography (`#14110f`).
- **Signature Brand Accent:** Svelte flame orange (`#ff3e00` for highlights, `#c2370a` for accessible text/button contrast >= 4.5:1 against white).
- **Sticky Capsule Navigation:** An elevated capsule navigation bar (`.stitch-nav`) with dynamic scroll pinning (`.stuck`), 16 px backdrop blur with color-mix saturation, and high-contrast pill actions.
- **Top Reading Progress:** A lightweight, non-blocking 3 px progress indicator (`.prog`) fixed to the viewport top tracking scroll depth.
- **Ambient Glowing Backdrop:** A soft, breathing radial gradient glow (`.blob`) floating subtly behind the hero section with reduced-motion safety.
- **Card Geometry & Radius System:** Generous, soft organic radii with a 32 px outer container (`rounded-3xl`), 24 px card containers (`rounded-2xl`), and 999 px capsule pill controls (`rounded-full`).
- **Interactive 3D Parallax Tilt:** The hero stacked cards (`.c1`, `.c2`, `.c3`) calculate relative pointer coordinates (`--px`, `--py`) on `pointermove` to provide smooth, layered 3D depth.
- **Segmented Bilingual Switcher:** A smooth segmented control (`.seg`) with sliding thumb indicator allowing seamless switching between English and Indonesian locales.
- **Secondary Dark Baseline (Espresso Night):** A deep espresso black canvas (`#14110f`) paired with dark roasted panels (`#211c19`), muted cream typography (`#f5f0ea`), and deep warm hairline borders (`#332c27`).
- **View-Transition Theme Toggle:** An interactive theme switcher using modern circular reveal view transitions where supported, with seamless CSS fallback.
- **Live Observability Status:** A pulsing emerald status dot (`.live` with `ping` keyframe animation), gradient status distribution bar, and Prometheus petal metrics grid.

## 3. Design tokens

The canonical tokens are declared in `apps/web/src/app.css` under Tailwind CSS 4's `@theme` block. They provide 1:1 compatibility with shadcn-svelte's standard semantic design system while maintaining convenience aliases for feature code.

### 3.1 Light theme (Warm Linen baseline)

| Token (Theme)   | Stitch Variable | Value     | Role / Intended use                        |
| --------------- | --------------- | --------- | ------------------------------------------ |
| `canvas`        | `--bg`          | `#f4efe9` | Warm linen canvas background               |
| `canvas-subtle` | `--bg2`         | `#e9dfd5` | Warm beige / clay secondary background     |
| `panel`         | `--surface`     | `#ffffff` | Elevated pure white card surfaces          |
| `foreground`    | `--ink`         | `#14110f` | Deep espresso primary text (14:1+ ratio)   |
| `muted`         | `--mute`        | `#665e57` | Balanced warm stone text (5:1+ WCAG AA)    |
| `border`        | `--line`        | `#e8e1d9` | Hairline container dividers and borders    |
| `accent`        | `--ink`         | `#14110f` | Solid espresso pill primary CTA buttons    |
| `brand`         | `--accent`      | `#c2370a` | Accessible flame brand mark and buttons    |
| `yellow`        | `--yellow`      | `#ffd25e` | Warm golden yellow accent tag              |
| `yellow-ink`    | `--yellow-ink`  | `#3a2b00` | High-contrast text on yellow (8.5:1 ratio) |
| `green`         | `--green`       | `#1f9d4c` | Fresh emerald status text and checks       |
| `green-bg`      | `--green-bg`    | `#d6f5e0` | Soft emerald background tint               |
| `danger`        | `--red`         | `#e5484d` | Crisp red error text                       |
| `danger-panel`  | `--red-bg`      | `#ffe3d9` | Soft warm red wash                         |

### 3.2 Dark theme (Espresso Night baseline)

| Token (Theme)   | Stitch Variable | Value                       | Role / Intended use                  |
| --------------- | --------------- | --------------------------- | ------------------------------------ |
| `canvas`        | `--bg`          | `#14110f`                   | Primary deep espresso background     |
| `canvas-subtle` | `--bg2`         | `#1d1815`                   | Deep dark clay secondary background  |
| `panel`         | `--surface`     | `#211c19`                   | Elevated dark roast card panels      |
| `foreground`    | `--ink`         | `#f5f0ea`                   | Warm cream primary text              |
| `muted`         | `--mute`        | `#a79d94`                   | Muted warm cream secondary text      |
| `border`        | `--line`        | `#332c27`                   | Dark hairline dividers and borders   |
| `accent`        | `--ink`         | `#f5f0ea`                   | Solid light pill primary CTA buttons |
| `brand`         | `--accent`      | `#ff3e00`                   | Svelte flame orange brand mark       |
| `danger`        | `--red`         | `#f87171`                   | Crisp error text                     |
| `danger-panel`  | `--red-bg`      | `rgba(248, 113, 113, 0.15)` | Soft translucent error wash          |
| `success`       | `--green`       | `#34d399`                   | Crisp success text                   |
| `success-panel` | `--green-bg`    | `rgba(52, 211, 153, 0.15)`  | Soft translucent success wash        |

Use semantic utilities such as `bg-canvas`, `text-foreground`, `text-muted`, `bg-panel`, `border-border`, and `bg-accent`. Standard shadcn-svelte utility aliases (`bg-background`, `bg-card`, `text-primary`, `border-input`, `ring`) are mapped via `@theme` in `app.css`.

The default baseline is light (`color-scheme: light`), with an active theme switcher activating `.dark` (`color-scheme: dark`).

## 4. Typography

The root font stack is:

```css
Inter, ui-sans-serif, system-ui, sans-serif
```

The root styles disable synthetic font faces, enable text antialiasing, and use optimized text rendering:

- Page title: strong, compact, and responsive with tight tracking (`tracking-tight`).
- Section title: distinguishable from body copy without excessive size.
- Supporting copy: use the muted semantic color.
- Labels: remain visible and associated with their input; do not rely on placeholder text as a label.
- Error and status text: be concise and programmatically associated with the affected control or live region.

## 5. Layout and spacing

The application uses a responsive shell up to `80rem` (`max-w-7xl`) for navigation and multi-column sections, with a split hero on wide screens. Individual copy blocks, cards, and interactive forms use narrower measures inside that shell.

Guidelines:

- Centered, readable content measure for forms and explanatory content.
- Responsive Tailwind utilities rather than viewport-specific fixed dimensions.
- Interactive controls at least 44 px high where practical (`min-h-11`).
- Preserves a minimum supported viewport width of 320 px without horizontal overflow.
- Panel surfaces establish grouping; no unnecessary card nesting.

## 6. Shared UI components (shadcn-svelte)

The repository provides a complete, source-owned component suite in `apps/web/src/lib/components/ui/`:

```text
apps/web/src/lib/components/ui/
├── alert/
│   ├── alert.svelte
│   ├── alert-title.svelte
│   ├── alert-description.svelte
│   └── index.ts
├── badge/
│   ├── badge.svelte
│   └── index.ts
├── button/
│   ├── button.svelte
│   └── index.ts
├── card/
│   ├── card.svelte
│   ├── card-header.svelte
│   ├── card-title.svelte
│   ├── card-description.svelte
│   ├── card-content.svelte
│   ├── card-footer.svelte
│   └── index.ts
├── dialog/
│   ├── dialog.svelte
│   ├── dialog-trigger.svelte
│   ├── dialog-content.svelte
│   ├── dialog-header.svelte
│   ├── dialog-title.svelte
│   ├── dialog-description.svelte
│   ├── dialog-footer.svelte
│   ├── dialog-close.svelte
│   └── index.ts
├── input/
│   ├── input.svelte
│   └── index.ts
├── separator/
│   ├── separator.svelte
│   └── index.ts
├── tabs/
│   ├── tabs.svelte
│   ├── tabs-list.svelte
│   ├── tabs-trigger.svelte
│   ├── tabs-content.svelte
│   └── index.ts
### Full Component Inventory

The project provides the complete official suite of shadcn-svelte components in `apps/web/src/lib/components/ui/`:

1. **Display and Layout:** `aspect-ratio`, `badge`, `breadcrumb`, `card`, `carousel`, `chart`, `empty`, `item`, `kbd`, `marker`, `progress`, `resizable`, `scroll-area`, `separator`, `skeleton`, `table`.
2. **Forms and Input:** `button`, `button-group`, `checkbox`, `field`, `form`, `input`, `input-group`, `input-otp`, `label`, `native-select`, `radio-group`, `select`, `slider`, `switch`, `textarea`, `toggle`, `toggle-group`.
3. **Overlays and Modals:** `alert`, `alert-dialog`, `dialog`, `drawer`, `dropdown-menu`, `hover-card`, `popover`, `sheet`, `sonner`, `tooltip`.
4. **Navigation and Menus:** `accordion`, `collapsible`, `context-menu`, `menubar`, `navigation-menu`, `pagination`, `sidebar`, `tabs`.
5. **Data, AI and Interactive:** `attachment`, `bubble`, `calendar`, `code-block`, `command`, `message`, `message-scroller`, `questionnaire`, `range-calendar`, `spinner`, `trace`.
6. **Backward Compatibility:** `Button.svelte`, `TextField.svelte`, and `index.ts` central barrel.

All components are implemented with Svelte 5 runes (`$props()`, `$state()`, `$derived()`, `$bindable()`), Bits UI primitives, and `tailwind-variants`.

## 7. Interaction and accessibility requirements

- Use semantic HTML elements before custom roles.
- Every form field requires a persistent, visible label.
- Keyboard users have a visible `:focus-visible` indicator (2 px outline with 2 px offset).
- Disabled, busy, invalid, success, and error states are perceivable without relying on color alone.
- Error text is linked via `aria-describedby` and `role="alert"`; status messages use `role="status"`.
- Honor global `prefers-reduced-motion: reduce`. All parallax, drift animations, and scaling transitions turn off automatically when reduced motion is preferred.
- Run Playwright and axe-core audits to verify zero WCAG A/AA violations across all states.

## 8. Icons

The application uses `unplugin-icons` with the Lucide Iconify collection. Icons are imported on demand at build time, keeping browser bundles minimal.
```
