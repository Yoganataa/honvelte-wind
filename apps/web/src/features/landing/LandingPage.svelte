<script lang="ts">
  import ArrowRightIcon from '~icons/lucide/arrow-right'
  import ArrowUpRightIcon from '~icons/lucide/arrow-up-right'
  import BoxesIcon from '~icons/lucide/boxes'
  import CheckIcon from '~icons/lucide/check'
  import CloudIcon from '~icons/lucide/cloud'
  import CodeIcon from '~icons/lucide/code-2'
  import CopyIcon from '~icons/lucide/copy'
  import DatabaseIcon from '~icons/lucide/database'
  import GithubIcon from '~icons/lucide/github'
  import LayersIcon from '~icons/lucide/layers-3'
  import MenuIcon from '~icons/lucide/menu'
  import PackageIcon from '~icons/lucide/package'
  import ShieldCheckIcon from '~icons/lucide/shield-check'
  import TerminalIcon from '~icons/lucide/terminal'
  import WindIcon from '~icons/lucide/wind'
  import WorkflowIcon from '~icons/lucide/workflow'
  import XIcon from '~icons/lucide/x'
  import ZapIcon from '~icons/lucide/zap'

  import GreetingPanel from './greeting/GreetingPanel.svelte'

  type CopyState = 'idle' | 'copied' | 'failed'

  let menuOpen = $state(false)
  let copyState = $state<CopyState>('idle')

  const repositoryUrl = 'https://github.com/Yoganataa/honvelte-wind'
  const setupCommands = [
    'git clone https://github.com/Yoganataa/honvelte-wind.git my-app',
    'cd my-app',
    'bun install',
    'bun run dev',
  ].join('\n')

  const navigation = [
    { label: 'Architecture', href: '#architecture' },
    { label: 'Features', href: '#features' },
    { label: 'Runtime', href: '#runtime' },
    { label: 'Playground', href: '#playground' },
  ]

  const stack = [
    { title: 'Svelte 5 + Vite', detail: 'A responsive frontend with a fast development loop.' },
    { title: 'Hono + Bun', detail: 'A small, standards-based API with a native Bun runtime.' },
    { title: 'Tailwind CSS 4', detail: 'Utility-first styling with centralized design tokens.' },
  ]

  const architecture = [
    {
      number: '01',
      title: 'Frontend',
      detail: 'Feature-owned UI, Svelte 5 runes, and a same-origin API client.',
      path: 'apps/web',
      icon: CodeIcon,
    },
    {
      number: '02',
      title: 'Shared contracts',
      detail: 'Zod schemas define the boundary between browser and server.',
      path: 'packages/contracts',
      icon: BoxesIcon,
    },
    {
      number: '03',
      title: 'Backend',
      detail: 'Hono routes, request middleware, and runtime adapters.',
      path: 'apps/api',
      icon: WorkflowIcon,
    },
  ]

  const capabilities = [
    {
      title: 'Authentication & sessions',
      detail: 'Opaque sessions, CSRF protection, OIDC identity boundaries, and server-side RBAC.',
      icon: ShieldCheckIcon,
      tag: 'Optional example',
    },
    {
      title: 'Database adapters',
      detail: 'Separate SQLite and PostgreSQL examples with ordered SQL migrations.',
      icon: DatabaseIcon,
      tag: 'Optional example',
    },
    {
      title: 'Background jobs',
      detail: 'Durable idempotency contracts, retries, and Cloudflare Queues + D1 adapters.',
      icon: WorkflowIcon,
      tag: 'Optional example',
    },
    {
      title: 'Request safety',
      detail: 'Bounded rate limiting, trusted principal keys, and request deadlines.',
      icon: ZapIcon,
      tag: 'Optional example',
    },
  ]

  const deliverySteps = [
    { title: 'Quality gates', detail: 'Format, audit, lint, types, unit tests, and build.' },
    { title: 'Browser E2E', detail: 'Real browser flows with accessibility scans.' },
    { title: 'Runtime checks', detail: 'Fetch adapter and local workerd smoke tests.' },
    { title: 'Controlled release', detail: 'Manual staging/production promotion and rollback.' },
  ]

  async function copySetupCommands() {
    try {
      await navigator.clipboard.writeText(setupCommands)
      copyState = 'copied'
    } catch {
      copyState = 'failed'
    }
  }

  function closeMenu() {
    menuOpen = false
  }
</script>

<svelte:head>
  <title>Honvelte Wind — A lean foundation for ambitious web apps</title>
  <meta
    name="description"
    content="Build with Svelte 5, Hono, Tailwind CSS 4, and Bun. A modular full-stack web starter with typed contracts and a verified delivery workflow."
  />
  <meta property="og:title" content="Honvelte Wind" />
  <meta
    property="og:description"
    content="A lean, modular full-stack foundation built with Svelte 5, Hono, Tailwind CSS 4, and Bun."
  />
  <meta property="og:type" content="website" />
</svelte:head>

<a
  class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-3 focus:font-semibold focus:text-canvas"
  href="#main"
>
  Skip to content
</a>

<div id="top" class="relative min-h-screen overflow-hidden bg-canvas text-foreground">
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_at_top,_rgba(103,232,249,0.12),_transparent_65%)]"
  ></div>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute left-1/2 top-[470px] h-px w-[min(1100px,90vw)] -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent"
  ></div>

  <header class="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
    <a
      href="#top"
      aria-label="Honvelte Wind home"
      class="group inline-flex items-center gap-3 rounded-lg focus-visible:outline-offset-4"
      onclick={closeMenu}
    >
      <span
        class="flex size-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent transition-colors group-hover:bg-accent/15"
      >
        <WindIcon class="size-5" aria-hidden="true" />
      </span>
      <span class="text-base font-semibold tracking-tight text-foreground">
        honvelte<span class="text-accent">.</span>wind
      </span>
    </a>

    <nav aria-label="Main navigation" class="hidden items-center gap-7 md:flex">
      {#each navigation as item (item.href)}
        <a
          href={item.href}
          class="rounded-md text-sm text-muted transition-colors hover:text-foreground focus-visible:text-foreground"
        >
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="hidden items-center gap-3 md:flex">
      <a
        href={repositoryUrl}
        target="_blank"
        rel="noreferrer"
        class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-accent/50 hover:bg-panel"
      >
        <GithubIcon class="size-4" aria-hidden="true" />
        GitHub
        <ArrowUpRightIcon class="size-3.5 text-muted" aria-hidden="true" />
      </a>
      <a
        href="#getting-started"
        class="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-canvas transition-colors hover:bg-accent-hover"
      >
        Get started
        <ArrowRightIcon class="size-4" aria-hidden="true" />
      </a>
    </div>

    <button
      type="button"
      class="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-panel md:hidden"
      aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
      aria-expanded={menuOpen}
      aria-controls="mobile-navigation"
      onclick={() => (menuOpen = !menuOpen)}
    >
      {#if menuOpen}
        <XIcon class="size-5" aria-hidden="true" />
      {:else}
        <MenuIcon class="size-5" aria-hidden="true" />
      {/if}
    </button>
  </header>

  <nav
    id="mobile-navigation"
    aria-label="Mobile navigation"
    hidden={!menuOpen}
    class="relative z-20 mx-5 mb-2 grid gap-1 rounded-xl border border-border bg-panel p-2 shadow-xl md:hidden"
  >
      {#each navigation as item (item.href)}
        <a
          href={item.href}
          class="rounded-lg px-3 py-3 text-sm text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
          onclick={closeMenu}
        >
          {item.label}
        </a>
      {/each}
      <a
        href={repositoryUrl}
        target="_blank"
        rel="noreferrer"
        class="rounded-lg px-3 py-3 text-sm text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
        onclick={closeMenu}
      >
        View on GitHub
      </a>
      <a
        href="#getting-started"
        class="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-canvas"
        onclick={closeMenu}
      >
        Get started
        <ArrowRightIcon class="size-4" aria-hidden="true" />
      </a>
  </nav>

  <main id="main" tabindex="-1" class="relative z-10">
    <section class="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12 lg:px-10 lg:pb-32 lg:pt-28">
      <div class="max-w-2xl">
        <div class="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent">
          <span class="size-1.5 rounded-full bg-success shadow-[0_0_12px_var(--color-success)]"></span>
          A lean foundation for ambitious web apps
        </div>

        <h1 class="mt-7 max-w-2xl text-5xl font-semibold leading-[1.08] tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl">
          Build boldly.
          <span class="block text-accent">Stay in control.</span>
        </h1>

        <p class="mt-7 max-w-xl text-base leading-8 text-muted sm:text-lg">
          Start with the boundaries that matter. Honvelte Wind brings Svelte 5,
          Hono, Tailwind CSS 4, and Bun together in a modular full-stack starter
          that stays lean until your product needs more.
        </p>

        <div class="mt-9 flex flex-col gap-3 sm:flex-row">
          <a
            href="#getting-started"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-semibold text-canvas shadow-lg shadow-accent/10 transition-colors hover:bg-accent-hover"
          >
            Start building
            <ArrowRightIcon class="size-4" aria-hidden="true" />
          </a>
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-accent/50 hover:bg-panel"
          >
            <GithubIcon class="size-4" aria-hidden="true" />
            Explore the repository
            <ArrowUpRightIcon class="size-4 text-muted" aria-hidden="true" />
          </a>
        </div>

        <div class="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
          <span class="inline-flex items-center gap-2">
            <CheckIcon class="size-3.5 text-success" aria-hidden="true" />
            Bun 1.4.4 workspace
          </span>
          <span class="inline-flex items-center gap-2">
            <CheckIcon class="size-3.5 text-success" aria-hidden="true" />
            Shared Zod contracts
          </span>
          <span class="inline-flex items-center gap-2">
            <CheckIcon class="size-3.5 text-success" aria-hidden="true" />
            CI-verified workflows
          </span>
        </div>
      </div>

      <div class="relative mx-auto w-full max-w-xl lg:ml-auto">
        <div
          aria-hidden="true"
          class="absolute -inset-5 rounded-[2rem] bg-accent/5 blur-2xl"
        ></div>
        <div class="relative overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl shadow-black/40">
          <div class="flex items-center justify-between border-b border-border px-5 py-4">
            <div class="flex items-center gap-3">
              <div class="flex gap-1.5" aria-hidden="true">
                <span class="size-2.5 rounded-full bg-danger/80"></span>
                <span class="size-2.5 rounded-full bg-accent/60"></span>
                <span class="size-2.5 rounded-full bg-success/80"></span>
              </div>
              <span class="text-xs font-medium text-muted">honvelte-wind / structure</span>
            </div>
            <span class="rounded-md border border-border px-2 py-1 font-mono text-[10px] text-muted">
              MONOREPO
            </span>
          </div>

          <div class="space-y-5 p-5 sm:p-7">
            <div>
              <p class="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                Clear boundaries
              </p>
              <div class="mt-4 space-y-3 font-mono text-sm">
                <div class="flex items-center gap-3">
                  <span class="text-accent">▾</span>
                  <span class="text-foreground">apps/</span>
                  <span class="ml-auto text-[11px] text-muted">runtimes</span>
                </div>
                <div class="ml-5 flex items-center gap-3">
                  <span class="text-muted">├─</span>
                  <span class="text-foreground">web/</span>
                  <span class="ml-auto text-[11px] text-muted">Svelte 5 + Vite</span>
                </div>
                <div class="ml-5 flex items-center gap-3">
                  <span class="text-muted">└─</span>
                  <span class="text-foreground">api/</span>
                  <span class="ml-auto text-[11px] text-muted">Hono</span>
                </div>
                <div class="flex items-center gap-3 pt-1">
                  <span class="text-accent">▾</span>
                  <span class="text-foreground">packages/</span>
                  <span class="ml-auto text-[11px] text-muted">shared code</span>
                </div>
                <div class="ml-5 flex items-center gap-3">
                  <span class="text-muted">└─</span>
                  <span class="text-foreground">contracts/</span>
                  <span class="ml-auto text-[11px] text-muted">Zod schemas</span>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-border bg-canvas p-4">
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                  <TerminalIcon class="size-3.5 text-accent" aria-hidden="true" />
                  One command to start
                </span>
                <span class="font-mono text-[10px] text-muted">BUN</span>
              </div>
              <div class="mt-3 space-y-2 font-mono text-xs leading-5">
                <p><span class="text-accent">$</span> bun install</p>
                <p><span class="text-accent">$</span> bun run dev</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <span class="rounded-md bg-panel-muted px-2.5 py-1.5 text-[11px] text-muted">Svelte 5</span>
              <span class="rounded-md bg-panel-muted px-2.5 py-1.5 text-[11px] text-muted">Hono</span>
              <span class="rounded-md bg-panel-muted px-2.5 py-1.5 text-[11px] text-muted">Tailwind 4</span>
              <span class="rounded-md bg-panel-muted px-2.5 py-1.5 text-[11px] text-muted">Bun</span>
            </div>
          </div>
        </div>
        <div class="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl border border-border bg-panel px-4 py-3 shadow-xl sm:flex">
          <span class="flex size-8 items-center justify-center rounded-lg bg-success-panel text-success">
            <CheckIcon class="size-4" aria-hidden="true" />
          </span>
          <span>
            <span class="block text-xs font-semibold text-foreground">Verified delivery</span>
            <span class="mt-0.5 block text-[11px] text-muted">Build · E2E · Worker smoke tests</span>
          </span>
        </div>
      </div>
    </section>

    <section class="border-y border-border bg-panel/40">
      <div class="mx-auto grid max-w-7xl gap-5 px-5 py-7 sm:grid-cols-3 sm:px-8 lg:px-10">
        {#each stack as item (item.title)}
          <article class="flex gap-4 sm:border-r sm:border-border sm:pr-5 last:border-0 last:pr-0">
            <span class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-panel text-accent">
              <PackageIcon class="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 class="text-sm font-semibold text-foreground">{item.title}</h2>
              <p class="mt-1.5 text-xs leading-5 text-muted">{item.detail}</p>
            </div>
          </article>
        {/each}
      </div>
    </section>

    <section id="architecture" class="scroll-mt-20 mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
      <div class="max-w-2xl">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Architecture</p>
        <h2 class="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          One workspace. <span class="text-muted">Clear boundaries.</span>
        </h2>
        <p class="mt-4 text-base leading-7 text-muted">
          Keep the browser, API, and shared contracts separate without making
          everyday development feel fragmented.
        </p>
      </div>

      <div class="mt-12 grid gap-4 md:grid-cols-3">
        {#each architecture as item (item.number)}
          <article class="group rounded-2xl border border-border bg-panel p-6 transition-colors hover:border-accent/40">
            <div class="flex items-center justify-between">
              <span class="font-mono text-xs text-muted">{item.number}</span>
              <span class="flex size-10 items-center justify-center rounded-xl border border-border bg-panel-muted text-accent transition-colors group-hover:border-accent/30 group-hover:bg-accent/10">
                {@const Icon = item.icon}<Icon class="size-5" aria-hidden="true" />
              </span>
            </div>
            <h3 class="mt-7 text-lg font-semibold text-foreground">{item.title}</h3>
            <p class="mt-2 min-h-14 text-sm leading-6 text-muted">{item.detail}</p>
            <div class="mt-6 border-t border-border pt-4 font-mono text-xs text-accent">
              {item.path}
            </div>
          </article>
        {/each}
      </div>

      <div class="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-panel-muted/60 p-5 text-center sm:flex-row sm:gap-6">
        <span class="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <LayersIcon class="size-4 text-accent" aria-hidden="true" />
          Browser UI
        </span>
        <ArrowRightIcon class="hidden size-4 text-muted sm:block" aria-hidden="true" />
        <span class="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <BoxesIcon class="size-4 text-accent" aria-hidden="true" />
          Shared Zod contracts
        </span>
        <ArrowRightIcon class="hidden size-4 text-muted sm:block" aria-hidden="true" />
        <span class="inline-flex items-center gap-2 text-xs font-medium text-foreground">
          <WorkflowIcon class="size-4 text-accent" aria-hidden="true" />
          Hono API
        </span>
      </div>
    </section>

    <section id="features" class="scroll-mt-20 border-y border-border bg-panel/35">
      <div class="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div class="max-w-2xl">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Built to extend</p>
            <h2 class="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Start lean. <span class="text-muted">Add capability with intent.</span>
            </h2>
          </div>
          <p class="max-w-md text-sm leading-6 text-muted">
            Optional examples give you a tested starting point without forcing
            every database, queue, or identity provider into the default install.
          </p>
        </div>

        <div class="mt-12 grid gap-4 sm:grid-cols-2">
          {#each capabilities as item (item.title)}
            <article class="flex gap-4 rounded-2xl border border-border bg-panel p-5 sm:p-6">
              <span class="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-panel-muted text-accent">
                <svelte:component this={item.icon} class="size-5" aria-hidden="true" />
              </span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-semibold text-foreground">{item.title}</h3>
                  <span class="rounded-md border border-border px-2 py-0.5 text-[10px] font-medium text-muted">
                    {item.tag}
                  </span>
                </div>
                <p class="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
              </div>
            </article>
          {/each}
        </div>
      </div>
    </section>

    <section id="runtime" class="scroll-mt-20 mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
      <div class="max-w-2xl">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Runtime profiles</p>
        <h2 class="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Choose where it runs.
          <span class="text-muted">Keep the boundaries.</span>
        </h2>
        <p class="mt-4 text-base leading-7 text-muted">
          The same Hono application can run as a Bun server or through a
          Fetch-compatible Cloudflare Worker adapter. Each runtime has explicit capabilities.
        </p>
      </div>

      <div class="mt-12 grid gap-4 lg:grid-cols-2">
        <article class="rounded-2xl border border-border bg-panel p-6 sm:p-8">
          <div class="flex items-center justify-between">
            <span class="flex size-11 items-center justify-center rounded-xl border border-border bg-panel-muted text-accent">
              <TerminalIcon class="size-5" aria-hidden="true" />
            </span>
            <span class="rounded-full border border-success-border bg-success-panel px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-success">
              Default profile
            </span>
          </div>
          <h3 class="mt-7 text-xl font-semibold text-foreground">Bun server</h3>
          <p class="mt-2 text-sm leading-6 text-muted">
            Run Hono and the built Svelte SPA in one process, with lifecycle
            handling, health/readiness probes, and an optional metrics endpoint.
          </p>
          <ul class="mt-6 space-y-3 text-sm text-muted">
            <li class="flex items-start gap-2">
              <CheckIcon class="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              Bun-native runtime and production bundle
            </li>
            <li class="flex items-start gap-2">
              <CheckIcon class="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              Graceful shutdown and readiness lifecycle
            </li>
            <li class="flex items-start gap-2">
              <CheckIcon class="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              Optional SQLite and PostgreSQL examples
            </li>
          </ul>
          <p class="mt-7 border-t border-border pt-4 font-mono text-xs text-muted">
            bun run build <span class="text-accent">→</span> bun run start
          </p>
        </article>

        <article class="rounded-2xl border border-border bg-panel p-6 sm:p-8">
          <div class="flex items-center justify-between">
            <span class="flex size-11 items-center justify-center rounded-xl border border-border bg-panel-muted text-accent">
              <CloudIcon class="size-5" aria-hidden="true" />
            </span>
            <span class="rounded-full border border-accent/25 bg-accent/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
              Edge profile
            </span>
          </div>
          <h3 class="mt-7 text-xl font-semibold text-foreground">Cloudflare Workers</h3>
          <p class="mt-2 text-sm leading-6 text-muted">
            Serve the SPA with Workers Static Assets and route same-origin API
            requests to Hono through the standard Fetch interface.
          </p>
          <ul class="mt-6 space-y-3 text-sm text-muted">
            <li class="flex items-start gap-2">
              <CheckIcon class="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              Separate staging and production environments
            </li>
            <li class="flex items-start gap-2">
              <CheckIcon class="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              Live health, API, SPA, and asset smoke tests
            </li>
            <li class="flex items-start gap-2">
              <CheckIcon class="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              Explicit rollback workflow
            </li>
          </ul>
          <p class="mt-7 border-t border-border pt-4 font-mono text-xs text-muted">
            wrangler deploy <span class="text-accent">→</span> verify <span class="text-accent">→</span> rollback
          </p>
        </article>
      </div>

      <p class="mt-5 text-xs leading-5 text-muted">
        Runtime note: Bun-specific database, session, in-memory rate-limit, and process lifecycle examples
        are not automatically portable to Cloudflare Workers. Use runtime-compatible adapters where needed.
      </p>
    </section>

    <section class="border-y border-border bg-panel/35">
      <div class="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-10 lg:py-28">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Delivery workflow</p>
          <h2 class="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Confidence at every step.
          </h2>
          <p class="mt-4 text-sm leading-7 text-muted">
            Changes move through automated quality checks before an operator
            promotes a release. Failed live verification has a rollback path.
          </p>
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
            class="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
          >
            Explore CI and deployment workflows
            <ArrowUpRightIcon class="size-4" aria-hidden="true" />
          </a>
        </div>

        <ol class="relative space-y-0">
          {#each deliverySteps as item, index (item.title)}
            <li class="relative flex gap-4 pb-7 last:pb-0">
              <div class="relative flex flex-col items-center">
                <span class="z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-panel text-xs font-semibold text-accent">
                  0{index + 1}
                </span>
                {#if index !== deliverySteps.length - 1}
                  <span class="absolute top-9 h-full w-px bg-border"></span>
                {/if}
              </div>
              <div class="min-w-0 pt-1">
                <h3 class="text-sm font-semibold text-foreground">{item.title}</h3>
                <p class="mt-1 text-sm leading-6 text-muted">{item.detail}</p>
              </div>
              {#if index === deliverySteps.length - 1}
                <span class="ml-auto mt-1 shrink-0 rounded-md border border-accent/25 bg-accent/5 px-2 py-1 text-[10px] font-medium text-accent">
                  Manual approval
                </span>
              {/if}
            </li>
          {/each}
        </ol>
      </div>
    </section>

    <section id="playground" class="scroll-mt-20 mx-auto grid w-full max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-10 lg:py-32">
      <div class="max-w-lg">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Try the API</p>
        <h2 class="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Not just a pretty scaffold.
        </h2>
        <p class="mt-4 text-base leading-7 text-muted">
          Send a real request through the Hono API. The browser client validates
          payloads with shared Zod contracts and gives structured feedback.
        </p>
        <div class="mt-7 flex flex-wrap gap-2">
          <span class="rounded-md border border-border bg-panel px-3 py-2 text-xs text-muted">Runtime validation</span>
          <span class="rounded-md border border-border bg-panel px-3 py-2 text-xs text-muted">Typed responses</span>
          <span class="rounded-md border border-border bg-panel px-3 py-2 text-xs text-muted">Request IDs</span>
        </div>
      </div>
      <div class="rounded-2xl border border-border bg-panel p-3 shadow-2xl shadow-black/20 sm:p-5">
        <GreetingPanel />
      </div>
    </section>

    <section id="getting-started" class="scroll-mt-20 px-5 pb-24 sm:px-8 lg:px-10 lg:pb-32">
      <div class="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-accent/20 bg-panel shadow-2xl shadow-accent/5">
        <div class="grid lg:grid-cols-[1fr_0.9fr]">
          <div class="p-7 sm:p-10 lg:p-12">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Your next commit starts here</p>
            <h2 class="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Make the first move.
            </h2>
            <p class="mt-4 max-w-md text-sm leading-7 text-muted">
              Clone the repository, install with the pinned Bun toolchain, and
              start shaping the foundation around your product.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a
                href={repositoryUrl}
                target="_blank"
                rel="noreferrer"
                class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-canvas transition-colors hover:bg-accent-hover"
              >
                Get the source
                <ArrowUpRightIcon class="size-4" aria-hidden="true" />
              </a>
              <a
                href={repositoryUrl + '#readme'}
                target="_blank"
                rel="noreferrer"
                class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-panel-muted"
              >
                Read the docs
                <ArrowUpRightIcon class="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div class="border-t border-border bg-canvas/70 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-9">
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                <TerminalIcon class="size-4 text-accent" aria-hidden="true" />
                Quick start
              </span>
              <button
                type="button"
                class="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                onclick={copySetupCommands}
              >
                {#if copyState === 'copied'}
                  <CheckIcon class="size-3.5 text-success" aria-hidden="true" />
                  Copied
                {:else}
                  <CopyIcon class="size-3.5" aria-hidden="true" />
                  Copy commands
                {/if}
              </button>
            </div>
            <pre class="mt-5 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-7 text-muted"><code>{setupCommands.split('\n').map((command) => '$ ' + command).join('\n')}</code></pre>
            <p class="mt-4 min-h-5 text-[11px] text-muted" aria-live="polite">
              {#if copyState === 'copied'}
                Commands copied to clipboard.
              {:else if copyState === 'failed'}
                Clipboard access is unavailable. Select the commands to copy.
              {:else}
                Requires Bun 1.4.4 · Version pinned in .bun-version
              {/if}
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="border-t border-border bg-panel/30">
    <div class="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
      <a href="#top" class="inline-flex w-fit items-center gap-2 text-sm font-semibold text-foreground">
        <WindIcon class="size-4 text-accent" aria-hidden="true" />
        honvelte.wind
      </a>
      <p class="text-xs text-muted">
        A modular full-stack web starter. Built to stay lean.
      </p>
      <div class="flex items-center gap-5 text-xs text-muted">
        <a href={repositoryUrl} target="_blank" rel="noreferrer" class="transition-colors hover:text-accent">
          GitHub
        </a>
        <a href={repositoryUrl + '/blob/main/ROADMAP.md'} target="_blank" rel="noreferrer" class="transition-colors hover:text-accent">
          Roadmap
        </a>
        <a href={repositoryUrl + '/blob/main/DESIGN.md'} target="_blank" rel="noreferrer" class="transition-colors hover:text-accent">
          Design
        </a>
      </div>
    </div>
  </footer>
</div>
