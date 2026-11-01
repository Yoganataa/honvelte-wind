<script lang="ts">
  import ActivityIcon from '~icons/lucide/activity'
  import ArrowRightIcon from '~icons/lucide/arrow-right'
  import BotIcon from '~icons/lucide/bot'
  import CheckIcon from '~icons/lucide/check'
  import CloudIcon from '~icons/lucide/cloud'
  import CopyIcon from '~icons/lucide/copy'
  import DatabaseIcon from '~icons/lucide/database'
  import GitBranchIcon from '~icons/lucide/git-branch'
  import GithubIcon from '~icons/lucide/github'
  import LayersIcon from '~icons/lucide/layers-3'
  import MenuIcon from '~icons/lucide/menu'
  import MoonIcon from '~icons/lucide/moon'
  import ServerIcon from '~icons/lucide/server'
  import ShieldIcon from '~icons/lucide/shield'
  import SunIcon from '~icons/lucide/sun'
  import TerminalIcon from '~icons/lucide/terminal'
  import XIcon from '~icons/lucide/x'
  import ZapIcon from '~icons/lucide/zap'

  import GreetingPanel from '../greeting/GreetingPanel.svelte'
  import UiShowcase from './UiShowcase.svelte'

  type CopyState = 'idle' | 'copied' | 'failed'
  type Locale = 'en' | 'id'

  let menuOpen = $state(false)
  let copyState = $state<CopyState>('idle')
  let theme = $state<'light' | 'dark'>('light')
  let locale = $state<Locale>('en')
  let scrollProgress = $state(0)
  let isNavStuck = $state(false)
  let pointerX = $state(0)
  let pointerY = $state(0)

  const translations = {
    en: {
      navSekilas: 'At a glance',
      navFeatures: 'Features',
      navComponents: 'Components',
      navObservability: 'Observability',
      navPlayground: 'Playground',
      navMulai: 'Get started',
      heroPillTag: 'Open source',
      heroPillText: 'Hono Svelte and Tailwind Boilerplate',
      heroTitlePrefix: 'Build boldly.',
      heroTitleSuffix: 'Stay in control.',
      heroLead:
        'Svelte 5 on the frontend, Hono on the backend, Tailwind CSS 4 for styling. Powered by Bun with shared Zod contracts, observability, and an AI-agent-friendly workflow.',
      startNow: 'Start now',
      exploreRepo: 'Explore the repository',
      bunProcess: 'Bun process serving both API and SPA',
      cardResponse: 'Response',
      cardZod: 'Zod-validated',
      cardWorkersDeploy: 'Workers deploy',
      cardAssets: 'Assets',
      cardStaticSpa: 'Static SPA',
      cardWorkerRoute: 'Worker route',
      cardAutomatic: 'Automatic',
      cardManualWorkflow: 'Manual workflow via GitHub Actions',
      cardReady: 'Ready to use',
      cardDeployProfiles: 'Deploy profiles',
      cardAgentSkills: 'Agent skills',
      atGlance: 'At a glance',
      atGlanceTitle: 'A clean foundation, no extra weight.',
      statWorkspace: 'Workspace',
      statWorkspaceDesc: 'Bun workspaces, apps and packages',
      statZod: 'Zod',
      statZodDesc: 'API contracts shared across apps',
      statAgents: 'AGENTS.md',
      statAgentsDesc: 'Instructions for AI agents',
      statOptional: 'Optional',
      statOptionalDesc: 'SQLite and PostgreSQL examples',
      features: 'Features',
      featuresTitle: 'Everything a real project needs.',
      featSvelteDesc:
        'Fine-grained runes reactivity, sub-second Vite HMR, and lean client-only browser bundles.',
      featHonoDesc:
        'Standards-first web routing running natively on Bun with sub-millisecond cold starts.',
      featTailwindDesc:
        'Centralized semantic tokens via @theme, high default contrast, and zero runtime overhead.',
      featBunServerDesc:
        'One single Bun process serves both the Hono API and the built SPA with graceful shutdown.',
      featWorkersDesc:
        'Static assets served through Workers Static Assets with API proxying to Hono using fetch.',
      featAgentDesc:
        'AGENTS.md and local Agent Skills for development, testing, and Playwright E2E.',
      observability: 'Observability',
      observabilityTitle: 'Watch every request in one place.',
      dashStatus: 'latest status',
      dashIllustrative: 'Illustrative view, not live data',
      dashValidatedRequestId: 'validated request id',
      dashPayloadValidated: 'payload validated by Zod',
      dashStandardError: 'standardized error envelope',
      prometheusMetrics: 'Prometheus metrics',
      petTotal: 'Total',
      petRequests: 'requests',
      petErrors: 'total errors',
      petDuration: 'Duration',
      petHistogram: 'histogram',
      petActive: 'Active',
      petInFlight: 'in-flight requests',
      prometheusNote:
        'The /api/metrics endpoint is disabled by default and protected by a bearer token.',
      playground: 'Playground',
      playgroundTitle: 'Test the API live.',
      getStarted: 'Get started',
      getStartedTitle: 'From clone to running in minutes.',
      copyCommand: 'Copy commands',
      copied: 'Copied to clipboard',
      copyFailed: 'Failed to copy',
      reqBun: 'Requires Bun 1.4.4',
      devTitle: 'Development',
      devDesc: 'Vite proxies /api/* to Hono during development.',
      prodTitle: 'Production',
      prodDesc:
        'Hono serves the API and the built SPA from one Bun process, same origin.',
      releaseTitle: 'Controlled releases',
      releaseDesc:
        'Manual deploy workflows with smoke tests and version rollback.',
      finalTitle: 'Ready to build your next project?',
      finalDesc: 'Grab the starter, adapt it, and ship.',
      openGithub: 'Open on GitHub',
      footerBrand: 'Honvelte Wind, Hono Svelte and Tailwind Boilerplate',
      copyright: '© 2026 Honvelte Wind by Yoganataa',
      themeToggleLight: 'Switch to light theme',
      themeToggleDark: 'Switch to dark theme',
    },
    id: {
      navSekilas: 'Sekilas',
      navFeatures: 'Features',
      navComponents: 'Komponen',
      navObservability: 'Observability',
      navPlayground: 'Playground',
      navMulai: 'Mulai',
      heroPillTag: 'Open source',
      heroPillText: 'Hono Svelte and Tailwind Boilerplate',
      heroTitlePrefix: 'Build boldly.',
      heroTitleSuffix: 'Stay in control.',
      heroLead:
        'Svelte 5 di frontend, Hono di backend, Tailwind CSS 4 untuk gaya. Dijalankan Bun dengan kontrak Zod bersama, observability, dan alur kerja yang ramah agen AI.',
      startNow: 'Mulai sekarang',
      exploreRepo: 'Explore the repository',
      bunProcess: 'proses Bun melayani API sekaligus SPA',
      cardResponse: 'Respons',
      cardZod: 'Tervalidasi Zod',
      cardWorkersDeploy: 'Deploy Workers',
      cardAssets: 'Aset',
      cardStaticSpa: 'SPA statis',
      cardWorkerRoute: 'Rute Worker',
      cardAutomatic: 'Otomatis',
      cardManualWorkflow: 'Workflow manual via GitHub Actions',
      cardReady: 'Siap pakai',
      cardDeployProfiles: 'Profil deploy',
      cardAgentSkills: 'Agent skills',
      atGlance: 'Sekilas',
      atGlanceTitle: 'Fondasi yang rapi, tanpa beban tambahan.',
      statWorkspace: 'Workspace',
      statWorkspaceDesc: 'Bun workspaces, apps dan packages',
      statZod: 'Zod',
      statZodDesc: 'Kontrak API dipakai bersama',
      statAgents: 'AGENTS.md',
      statAgentsDesc: 'Instruksi untuk agen AI',
      statOptional: 'Opsional',
      statOptionalDesc: 'Contoh SQLite dan PostgreSQL',
      features: 'Features',
      featuresTitle: 'Semua yang dibutuhkan proyek nyata.',
      featSvelteDesc:
        'Reaktivitas fine-grained runes, feedback HMR kilat, dan bundle browser client-only yang ramping.',
      featHonoDesc:
        'Standards-first web routing native di Bun dengan cold start sub-milidetik.',
      featTailwindDesc:
        'Sentralisasi token semantik via @theme, kontras tinggi default, dan zero runtime overhead.',
      featBunServerDesc:
        'Satu proses Bun menyajikan Hono API dan SPA hasil produksi dengan graceful shutdown.',
      featWorkersDesc:
        'Aset statis dilayani lewat Workers Static Assets dengan proksi API ke Hono menggunakan Fetch.',
      featAgentDesc:
        'AGENTS.md, skrip verifikasi otomatis, unit tests Bun, dan E2E Playwright dengan audit axe-core.',
      observability: 'Observability',
      observabilityTitle: 'Pantau setiap request dari satu tempat.',
      dashStatus: 'status terbaru',
      dashIllustrative: 'Contoh tampilan, bukan data langsung',
      dashValidatedRequestId: 'request id tervalidasi',
      dashPayloadValidated: 'payload divalidasi Zod',
      dashStandardError: 'envelope error terstandar',
      prometheusMetrics: 'Metrik Prometheus',
      petTotal: 'Total',
      petRequests: 'request',
      petErrors: 'total error',
      petDuration: 'Durasi',
      petHistogram: 'histogram',
      petActive: 'Aktif',
      petInFlight: 'request berjalan',
      prometheusNote:
        'Endpoint /api/metrics nonaktif secara default dan dilindungi bearer token.',
      playground: 'Playground',
      playgroundTitle: 'Uji API secara langsung.',
      getStarted: 'Mulai',
      getStartedTitle: 'Dari clone sampai jalan dalam hitungan menit.',
      copyCommand: 'Salin perintah',
      copied: 'Disalin ke clipboard',
      copyFailed: 'Gagal menyalin',
      reqBun: 'Membutuhkan Bun 1.4.4',
      devTitle: 'Pengembangan',
      devDesc: 'Vite memproksikan /api/* ke Hono selama mode dev.',
      prodTitle: 'Produksi',
      prodDesc:
        'Hono menyajikan API dan SPA hasil build dari satu proses Bun, origin yang sama.',
      releaseTitle: 'Rilis terkontrol',
      releaseDesc:
        'Workflow deploy manual dengan smoke test dan rollback versi.',
      finalTitle: 'Siap membangun yang berikutnya?',
      finalDesc: 'Ambil starter-nya, ubah sesuai kebutuhan, lalu kirim.',
      openGithub: 'Buka di GitHub',
      footerBrand: 'Honvelte Wind, Hono Svelte and Tailwind Boilerplate',
      copyright: '© 2026 Honvelte Wind oleh Yoganataa',
      themeToggleLight: 'Ganti ke tema terang',
      themeToggleDark: 'Ganti ke tema gelap',
    },
  }

  const t = $derived(translations[locale])

  $effect(() => {
    if (typeof window !== 'undefined') {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark'
      theme = isDark ? 'dark' : 'light'

      try {
        const savedLocale = localStorage.getItem('hw-locale')
        if (savedLocale === 'id' || savedLocale === 'en') {
          locale = savedLocale
        }
      } catch {
        // Ignore storage restrictions
      }
    }
  })

  $effect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const h = document.documentElement
      isNavStuck = h.scrollTop > 12
      const maxScroll = h.scrollHeight - h.clientHeight
      scrollProgress = maxScroll > 0 ? h.scrollTop / maxScroll : 0
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  })

  function setLocale(newLocale: Locale) {
    locale = newLocale
    try {
      localStorage.setItem('hw-locale', newLocale)
    } catch {
      // Ignore storage restrictions
    }
  }

  function toggleTheme(event?: MouseEvent) {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    theme = nextTheme

    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const applyTheme = () => {
        if (nextTheme === 'dark') {
          root.classList.add('dark')
          root.setAttribute('data-theme', 'dark')
        } else {
          root.classList.remove('dark')
          root.setAttribute('data-theme', 'light')
        }
        try {
          localStorage.setItem('theme', nextTheme)
        } catch {
          // Ignore storage restrictions
        }
      }

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      type TransitionDocument = Document & {
        startViewTransition?: (updateCallback: () => void) => {
          ready: Promise<void>
        }
      }

      const doc = document as TransitionDocument
      if (
        typeof doc.startViewTransition === 'function' &&
        !reducedMotion &&
        event
      ) {
        const x = event.clientX
        const y = event.clientY
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y),
        )
        const transition = doc.startViewTransition(applyTheme)
        transition.ready
          .then(() => {
            root.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 700,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                pseudoElement: '::view-transition-new(root)',
              },
            )
          })
          .catch(() => {
            applyTheme()
          })
      } else {
        applyTheme()
      }
    }
  }

  const repositoryUrl = 'https://github.com/Yoganataa/honvelte-wind'
  const setupCommands = [
    'git clone https://github.com/Yoganataa/honvelte-wind',
    'cd honvelte-wind',
    'bun install',
    'bun run dev',
  ].join('\n')

  async function copySetupCommands() {
    try {
      await navigator.clipboard.writeText(setupCommands)
      copyState = 'copied'
      setTimeout(() => {
        copyState = 'idle'
      }, 2000)
    } catch {
      copyState = 'failed'
    }
  }

  function handleHeroPointerMove(event: PointerEvent) {
    const currentTarget = event.currentTarget as HTMLElement
    if (!currentTarget) return
    const rect = currentTarget.getBoundingClientRect()
    pointerX = parseFloat(
      (((event.clientX - rect.left) / rect.width - 0.5) * 2).toFixed(3),
    )
    pointerY = parseFloat(
      (((event.clientY - rect.top) / rect.height - 0.5) * 2).toFixed(3),
    )
  }

  function handleHeroPointerLeave() {
    pointerX = 0
    pointerY = 0
  }

  function closeMenu() {
    menuOpen = false
  }
</script>

<svelte:head>
  <title>Honvelte Wind: Boilerplate Hono, Svelte, dan Tailwind</title>
  <meta
    name="description"
    content="Starter full-stack siap produksi dengan Svelte 5, Hono, Bun, dan Tailwind CSS 4."
  />
  <meta property="og:title" content="Honvelte Wind" />
  <meta
    property="og:description"
    content="Starter full-stack siap produksi dengan Svelte 5, Hono, Bun, dan Tailwind CSS 4."
  />
  <meta property="og:type" content="website" />
</svelte:head>

<!-- Top Reading Progress Indicator -->
<div
  class="prog"
  style="transform: scaleX({scrollProgress})"
  aria-hidden="true"
></div>

<a
  class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:font-semibold focus:text-accent-foreground"
  href="#main"
>
  Skip to content
</a>

<div
  id="top"
  class="shell min-h-screen p-3.5 selection:bg-brand selection:text-white"
>
  <!-- Ambient Soft Glowing Radial Backdrop -->
  <div class="blob" aria-hidden="true"></div>

  <div class="container-inner">
    <!-- Sticky Capsule Navigation -->
    <nav class="stitch-nav {isNavStuck ? 'stuck' : ''}">
      <a
        class="logo"
        href="#top"
        aria-label="Honvelte Wind home"
        onclick={closeMenu}
      >
        <img
          class="mark"
          src="/logo.webp"
          width="32"
          height="32"
          alt="Honvelte Wind logo"
        />
        Honvelte Wind
      </a>

      <div class="links">
        <a href="#sekilas">{t.navSekilas}</a>
        <a href="#features">{t.navFeatures}</a>
        <a href="#components">{t.navComponents}</a>
        <a href="#observability">{t.navObservability}</a>
        <a href="#playground">{t.navPlayground}</a>
        <a href="#mulai">{t.navMulai}</a>
      </div>

      <div class="right">
        <!-- Segmented Language Switcher -->
        <div class="seg" data-l={locale} role="group" aria-label="Language">
          <span
            class="thumb"
            style="transform: translateX({locale === 'id' ? '46px' : '0'})"
          ></span>
          <button
            type="button"
            aria-pressed={locale === 'en'}
            onclick={() => setLocale('en')}
          >
            EN
          </button>
          <button
            type="button"
            aria-pressed={locale === 'id'}
            onclick={() => setLocale('id')}
          >
            ID
          </button>
        </div>

        <!-- Theme Switcher -->
        <button
          type="button"
          class="theme"
          onclick={toggleTheme}
          aria-label={theme === 'dark' ? t.themeToggleLight : t.themeToggleDark}
        >
          {#if theme === 'dark'}
            <SunIcon class="size-4" aria-hidden="true" />
          {:else}
            <MoonIcon class="size-4" aria-hidden="true" />
          {/if}
        </button>

        <a
          class="btn nav-cta"
          href={repositoryUrl}
          target="_blank"
          rel="noreferrer"
        >
          <GithubIcon class="size-4" aria-hidden="true" />
          GitHub
        </a>

        <button
          type="button"
          class="mobile-toggle"
          aria-label={menuOpen
            ? 'Close navigation menu'
            : 'Open navigation menu'}
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
      </div>
    </nav>

    <!-- Mobile Navigation Drawer -->
    <nav
      id="mobile-navigation"
      aria-label="Mobile navigation"
      hidden={!menuOpen}
      class="mobile-nav"
    >
      <a href="#sekilas" onclick={closeMenu}>{t.navSekilas}</a>
      <a href="#features" onclick={closeMenu}>Features</a>
      <a href="#components" onclick={closeMenu}>{t.navComponents}</a>
      <a href="#observability" onclick={closeMenu}>{t.navObservability}</a>
      <a href="#playground" onclick={closeMenu}>{t.navPlayground}</a>
      <a href="#mulai" onclick={closeMenu}>{t.navMulai}</a>
      <a
        href={repositoryUrl}
        target="_blank"
        rel="noreferrer"
        class="flex items-center gap-2"
        onclick={closeMenu}
      >
        <GithubIcon class="size-4" aria-hidden="true" />
        {t.openGithub}
      </a>
      <div
        class="mt-2 flex items-center justify-between border-t border-line pt-3"
      >
        <span class="text-xs font-semibold text-mute">Language</span>
        <div
          class="seg"
          data-l={locale}
          role="group"
          aria-label="Language selection"
        >
          <span
            class="thumb"
            style="transform: translateX({locale === 'id' ? '46px' : '0'})"
          ></span>
          <button
            type="button"
            aria-pressed={locale === 'en'}
            onclick={() => setLocale('en')}
          >
            EN
          </button>
          <button
            type="button"
            aria-pressed={locale === 'id'}
            onclick={() => setLocale('id')}
          >
            ID
          </button>
        </div>
      </div>
      <button
        type="button"
        onclick={toggleTheme}
        class="mt-2 flex items-center justify-between text-left"
      >
        <span>Tema: {theme === 'dark' ? 'Gelap' : 'Terang'}</span>
        {#if theme === 'dark'}
          <SunIcon class="size-4 text-mute" aria-hidden="true" />
        {:else}
          <MoonIcon class="size-4 text-mute" aria-hidden="true" />
        {/if}
      </button>
    </nav>

    <main id="main" tabindex="-1" class="focus:outline-none">
      <!-- Hero Section with Pointer Parallax -->
      <header class="hero">
        <div>
          <span class="pill">
            <b>{t.heroPillTag}</b>
            {t.heroPillText}
          </span>
          <h1>
            {t.heroTitlePrefix} <em class="block">{t.heroTitleSuffix}</em>
          </h1>
          <p class="lead">
            {t.heroLead}
          </p>
          <div class="cta">
            <a class="btn" href="#mulai">
              {t.startNow}
              <ArrowRightIcon class="size-4" aria-hidden="true" />
            </a>
            <a
              class="btn ghost"
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
            >
              <GithubIcon class="size-4" aria-hidden="true" />
              {t.exploreRepo}
            </a>
          </div>
          <div class="chips">
            <span class="chip">Svelte 5</span>
            <span class="chip">Hono</span>
            <span class="chip">Bun</span>
            <span class="chip">Tailwind CSS 4</span>
            <span class="chip">TypeScript strict</span>
          </div>
          <div class="big">
            <strong>1</strong>
            <span>{t.bunProcess}</span>
          </div>
        </div>

        <!-- Floating Stacked Cards with Parallax Tilt -->
        <div
          class="stack"
          aria-hidden="true"
          onpointermove={handleHeroPointerMove}
          onpointerleave={handleHeroPointerLeave}
          style="--px: {pointerX}; --py: {pointerY};"
        >
          <div class="card c1">
            <div class="row">
              <b>
                <ServerIcon class="size-4" aria-hidden="true" />
                GET /api/health
              </b>
              <span class="tag t-g">200 OK</span>
            </div>
            <div class="meta">
              <span>Runtime<b>Bun + Hono</b></span>
              <span>{t.cardResponse}<b>{t.cardZod}</b></span>
              <span>Request ID<b>UUID</b></span>
            </div>
          </div>

          <div class="card c2">
            <div class="row">
              <b>
                <CloudIcon class="size-4" aria-hidden="true" />
                {t.cardWorkersDeploy}
              </b>
              <span>
                <span class="tag t-o">Staging</span>
                <span class="tag t-y">Production</span>
              </span>
            </div>
            <div class="meta">
              <span>{t.cardAssets}<b>{t.cardStaticSpa}</b></span>
              <span>{t.cardWorkerRoute}<b>/api/*</b></span>
              <span>Rollback<b>{t.cardAutomatic}</b></span>
            </div>
            <div class="row mt-3.5">
              <small class="text-mute">{t.cardManualWorkflow}</small>
              <span class="ai">
                <ZapIcon class="size-3.5" aria-hidden="true" />
                Deploy
              </span>
            </div>
          </div>

          <div class="card c3">
            <b>{t.cardReady}</b>
            <div class="meta">
              <span><b>2</b>{t.cardDeployProfiles}</span>
              <span><b>3</b>{t.cardAgentSkills}</span>
              <span><b>E2E</b>Playwright</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Sekilas Section -->
      <section id="sekilas">
        <span class="eyebrow">{t.atGlance}</span>
        <h2>{t.atGlanceTitle}</h2>
        <div class="grid4">
          <div class="card stat">
            <div class="badge b-o">
              <LayersIcon class="size-5" aria-hidden="true" />
            </div>
            <strong>{t.statWorkspace}</strong>
            <small>{t.statWorkspaceDesc}</small>
          </div>
          <div class="card stat">
            <div class="badge b-y">
              <ShieldIcon class="size-5" aria-hidden="true" />
            </div>
            <strong>{t.statZod}</strong>
            <small>{t.statZodDesc}</small>
          </div>
          <div class="card stat stat-tilted">
            <div class="badge b-g">
              <BotIcon class="size-5" aria-hidden="true" />
            </div>
            <strong>{t.statAgents}</strong>
            <small>{t.statAgentsDesc}</small>
          </div>
          <div class="card stat">
            <div class="badge">
              <DatabaseIcon class="size-5" aria-hidden="true" />
            </div>
            <strong>{t.statOptional}</strong>
            <small>{t.statOptionalDesc}</small>
          </div>
        </div>
      </section>

      <!-- Fitur Section -->
      <section id="features">
        <span class="eyebrow">{t.features}</span>
        <h2>{t.featuresTitle}</h2>
        <div class="feat">
          <div class="card">
            <div class="badge b-o">
              <ShieldIcon class="size-5" aria-hidden="true" />
            </div>
            <h3>Svelte 5 + Vite</h3>
            <p>{t.featSvelteDesc}</p>
          </div>
          <div class="card">
            <div class="badge b-y">
              <ActivityIcon class="size-5" aria-hidden="true" />
            </div>
            <h3>Hono + Bun</h3>
            <p>{t.featHonoDesc}</p>
          </div>
          <div class="card">
            <div class="badge b-g">
              <ZapIcon class="size-5" aria-hidden="true" />
            </div>
            <h3>Tailwind CSS 4</h3>
            <p>{t.featTailwindDesc}</p>
          </div>
          <div class="card">
            <div class="badge b-o">
              <ServerIcon class="size-5" aria-hidden="true" />
            </div>
            <h3>Bun server</h3>
            <p>{t.featBunServerDesc}</p>
          </div>
          <div class="card">
            <div class="badge b-y">
              <CloudIcon class="size-5" aria-hidden="true" />
            </div>
            <h3>Cloudflare Workers</h3>
            <p>{t.featWorkersDesc}</p>
          </div>
          <div class="card">
            <div class="badge b-g">
              <BotIcon class="size-5" aria-hidden="true" />
            </div>
            <h3>Agent-ready &amp; E2E</h3>
            <p>{t.featAgentDesc}</p>
          </div>
        </div>
      </section>

      <!-- Observability Section -->
      <section id="observability">
        <span class="eyebrow">{t.observability}</span>
        <h2>{t.observabilityTitle}</h2>
        <div class="card dash" aria-hidden="true">
          <div class="side">
            <span><ActivityIcon class="size-4" aria-hidden="true" /></span>
            <span><ServerIcon class="size-4" aria-hidden="true" /></span>
            <span><DatabaseIcon class="size-4" aria-hidden="true" /></span>
            <span><TerminalIcon class="size-4" aria-hidden="true" /></span>
          </div>
          <div class="main-dash">
            <div class="top">
              <span class="live"></span>
              <strong>200</strong>
              <small>
                {t.dashStatus}
                <br />
                {t.dashIllustrative}
              </small>
            </div>
            <div class="bar"></div>
            <div class="list">
              <div class="li">
                <span class="meth">GET</span>
                <span>
                  <code>/api/health</code>
                  <small>{t.dashValidatedRequestId}</small>
                </span>
                <span class="tag t-g">200</span>
                <CheckIcon class="size-4 text-green" aria-hidden="true" />
              </div>
              <div class="li">
                <span class="meth">POST</span>
                <span>
                  <code>/api/greeting</code>
                  <small>{t.dashPayloadValidated}</small>
                </span>
                <span class="tag t-g">200</span>
                <CheckIcon class="size-4 text-green" aria-hidden="true" />
              </div>
              <div class="li">
                <span class="meth">GET</span>
                <span>
                  <code>/api/unknown</code>
                  <small>{t.dashStandardError}</small>
                </span>
                <span class="tag t-o">404</span>
                <ShieldIcon class="size-4 text-red" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div class="petal">
            <b class="text-sm">{t.prometheusMetrics}</b>
            <div class="pet">
              <div style="background:#ffd9a0">
                <b>{t.petTotal}</b>{t.petRequests}
              </div>
              <div style="background:#ffc4a0"><b>5xx</b>{t.petErrors}</div>
              <div style="background:#ffe9b0">
                <b>{t.petDuration}</b>{t.petHistogram}
              </div>
              <div style="background:#eadfd0">
                <b>{t.petActive}</b>{t.petInFlight}
              </div>
            </div>
            <p class="note">
              {t.prometheusNote}
            </p>
          </div>
        </div>
      </section>

      <!-- Playground Section -->
      <section id="playground" class="scroll-mt-20">
        <span class="eyebrow">{t.playground}</span>
        <h2>{t.playgroundTitle}</h2>
        <div class="mt-6">
          <GreetingPanel />
        </div>
        <div id="components" class="scroll-mt-24">
          <UiShowcase />
        </div>
      </section>

      <!-- Mulai Section -->
      <section id="mulai">
        <span class="eyebrow">{t.getStarted}</span>
        <h2>{t.getStartedTitle}</h2>
        <div class="start">
          <div class="codewrap">
            <pre class="term-box"><code
                ><i>$</i> git clone https://github.com/Yoganataa/honvelte-wind
<i>$</i> cd honvelte-wind
<i>$</i> bun install
<i>$</i> bun run dev</code
              ></pre>
            <button
              type="button"
              class="copy-btn"
              onclick={copySetupCommands}
              aria-label={t.copyCommand}
            >
              {#if copyState === 'copied'}
                <CheckIcon class="size-4 text-green" aria-hidden="true" />
              {:else}
                <CopyIcon class="size-4" aria-hidden="true" />
              {/if}
            </button>
          </div>
          <div class="steps">
            <div>
              <span class="badge b-o">
                <TerminalIcon class="size-5" aria-hidden="true" />
              </span>
              <span>
                <h3>{t.devTitle}</h3>
                <p>{t.devDesc}</p>
              </span>
            </div>
            <div>
              <span class="badge b-y">
                <ServerIcon class="size-5" aria-hidden="true" />
              </span>
              <span>
                <h3>{t.prodTitle}</h3>
                <p>{t.prodDesc}</p>
              </span>
            </div>
            <div>
              <span class="badge b-g">
                <GitBranchIcon class="size-5" aria-hidden="true" />
              </span>
              <span>
                <h3>{t.releaseTitle}</h3>
                <p>{t.releaseDesc}</p>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA -->
      <div class="final">
        <h2>{t.finalTitle}</h2>
        <p class="mb-6 opacity-75">
          {t.finalDesc}
        </p>
        <a class="btn" href={repositoryUrl} target="_blank" rel="noreferrer">
          <GithubIcon class="size-4" aria-hidden="true" />
          {t.openGithub}
        </a>
      </div>
    </main>

    <!-- Footer -->
    <footer class="stitch-foot">
      <span class="flex items-center gap-2">
        <img
          class="mark"
          src="/logo.webp"
          width="22"
          height="22"
          alt=""
          style="width:22px;height:22px"
        />
        {t.footerBrand}
      </span>
      <span>Svelte 5 · Hono · Bun · Tailwind CSS 4</span>
      <span class="cr">{t.copyright}</span>
    </footer>
  </div>
</div>

<style>
  .shell {
    position: relative;
    overflow: hidden;
    overflow: clip;
    background: linear-gradient(180deg, var(--bg2), var(--bg) 60%);
  }

  .shell > *:not(.blob) {
    position: relative;
  }

  .container-inner {
    max-width: 1180px;
    margin: 0 auto;
  }

  /* Fixed Top Reading Progress Indicator */
  .prog {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    width: 100%;
    background: var(--accent);
    transform-origin: 0 50%;
    z-index: 50;
    pointer-events: none;
    transition: transform 0.1s ease-out;
  }

  /* Ambient Glowing Blob */
  .blob {
    position: absolute;
    top: -180px;
    right: -160px;
    width: 640px;
    height: 640px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 35% 35%,
      rgba(255, 138, 40, 0.38),
      rgba(255, 62, 0, 0.12) 55%,
      transparent 72%
    );
    filter: blur(30px);
    pointer-events: none;
    z-index: 0;
    animation: drift 14s ease-in-out infinite;
  }

  @keyframes drift {
    50% {
      transform: translate(-50px, 40px) scale(1.08);
    }
  }

  /* Sticky Capsule Navigation */
  .stitch-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 20px;
    background: color-mix(in srgb, var(--surface) 86%, transparent);
    border-radius: 999px;
    box-shadow: var(--shadow);
    position: sticky;
    top: 12px;
    z-index: 40;
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    backdrop-filter: blur(16px) saturate(1.4);
    transition:
      box-shadow 0.3s ease,
      background 0.3s ease;
  }

  .stitch-nav.stuck {
    box-shadow: 0 14px 40px -16px rgba(60, 40, 20, 0.4);
  }

  .logo {
    font-weight: 800;
    font-size: 20px;
    letter-spacing: -0.03em;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink);
    text-decoration: none;
  }

  .mark {
    width: 32px;
    height: 32px;
    flex: none;
    border-radius: 9px;
    display: block;
    transition: transform 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  .logo:hover .mark {
    transform: rotate(-8deg) scale(1.1);
  }

  .links {
    display: flex;
    gap: 28px;
    font-size: 14px;
  }

  .links a {
    color: var(--mute);
    text-decoration: none;
    font-weight: 500;
    position: relative;
    transition: color 0.3s;
  }

  .links a::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -4px;
    height: 2px;
    border-radius: 2px;
    background: var(--accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .links a:hover {
    color: var(--ink);
  }

  .links a:hover::after {
    transform: scaleX(1);
  }

  .right {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  /* Segmented Language Switcher */
  .seg {
    display: flex;
    background: var(--bg2);
    border-radius: 999px;
    padding: 3px;
    position: relative;
    transition: background 0.5s;
  }

  .seg button {
    border: 0;
    background: transparent;
    color: var(--mute);
    font: 700 12px inherit;
    font-family: inherit;
    width: 46px;
    padding: 8px 0;
    border-radius: 999px;
    cursor: pointer;
    position: relative;
    z-index: 1;
    text-align: center;
    transition: color 0.35s;
  }

  .seg button[aria-pressed='true'] {
    color: var(--bg);
  }

  .seg .thumb {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 3px;
    width: 46px;
    border-radius: 999px;
    background: var(--ink);
    transition:
      transform 0.45s cubic-bezier(0.3, 1.25, 0.5, 1),
      background 0.5s;
    z-index: 0;
  }

  .theme {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 0;
    background: var(--bg2);
    color: var(--ink);
    cursor: pointer;
    display: grid;
    place-items: center;
    transition:
      transform 0.2s,
      background 0.3s;
  }

  .theme:hover {
    transform: scale(1.08);
  }

  .theme:active {
    transform: scale(0.94);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 0;
    cursor: pointer;
    font-family: inherit;
    font-weight: 600;
    font-size: 14px;
    padding: 11px 20px;
    border-radius: 999px;
    background: var(--ink);
    color: var(--bg);
    text-decoration: none;
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      background 0.2s;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 26px -12px rgba(0, 0, 0, 0.45);
  }

  .btn:active {
    transform: scale(0.97);
  }

  .btn.ghost {
    background: var(--bg2);
    color: var(--ink);
  }

  .mobile-toggle {
    display: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 0;
    background: var(--bg2);
    color: var(--ink);
    cursor: pointer;
    place-items: center;
  }

  .mobile-nav {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 10px;
    padding: 16px 20px;
    background: var(--surface);
    border-radius: 20px;
    box-shadow: var(--shadow);
  }

  .mobile-nav a {
    color: var(--mute);
    font-weight: 500;
    text-decoration: none;
    padding: 6px 0;
  }

  .mobile-nav a:hover {
    color: var(--ink);
  }

  /* Hero Section */
  .hero {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 40px;
    padding: 48px 0 20px;
    align-items: center;
  }

  .pill {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--line);
    color: var(--ink);
  }

  .pill b {
    background: #c2370a;
    color: #fff;
    border-radius: 999px;
    padding: 1px 8px;
    font-size: 11px;
  }

  h1 {
    font-size: clamp(38px, 6vw, 66px);
    line-height: 1.02;
    letter-spacing: -0.04em;
    margin: 18px 0;
    color: var(--ink);
    font-weight: 800;
  }

  h1 em {
    font-style: normal;
    color: var(--mute);
  }

  .lead {
    color: var(--mute);
    max-width: 48ch;
    font-size: 17px;
    line-height: 1.55;
  }

  .cta {
    display: flex;
    gap: 10px;
    margin-top: 28px;
    flex-wrap: wrap;
  }

  .chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 22px;
  }

  .chip {
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--line);
    color: var(--ink);
    transition:
      transform 0.2s,
      border-color 0.2s;
  }

  .chip:hover {
    transform: translateY(-3px);
    border-color: var(--accent);
  }

  .big {
    display: flex;
    align-items: flex-end;
    gap: 18px;
    margin-top: 34px;
  }

  .big strong {
    font-size: 88px;
    line-height: 0.9;
    letter-spacing: -0.05em;
    color: var(--ink);
  }

  .big span {
    color: var(--mute);
    font-size: 13px;
    max-width: 20ch;
    padding-bottom: 6px;
  }

  /* Parallax Floating Stack */
  .stack {
    position: relative;
    min-height: 440px;
  }

  .card {
    background: var(--surface);
    border-radius: 24px;
    padding: 18px 20px;
    box-shadow: var(--shadow);
    border: 1px solid var(--line);
  }

  .c1 {
    position: absolute;
    top: 0;
    left: 0;
    right: 30px;
    translate: calc(var(--px, 0) * 8px) calc(var(--py, 0) * 8px);
    transition: translate 0.25s ease-out;
  }

  .c2 {
    position: absolute;
    top: 150px;
    left: 30px;
    right: 0;
    transform: rotate(-2deg);
    translate: calc(var(--px, 0) * 16px) calc(var(--py, 0) * 16px);
    transition: translate 0.25s ease-out;
  }

  .c3 {
    position: absolute;
    top: 322px;
    left: 0;
    right: 60px;
    background: var(--yellow);
    color: var(--yellow-ink);
    border: 0;
    translate: calc(var(--px, 0) * 24px) calc(var(--py, 0) * 24px);
    transition: translate 0.25s ease-out;
  }

  .c3 .meta {
    border-color: rgba(0, 0, 0, 0.15);
    color: #5a4400;
  }

  .c3 .meta b {
    color: #3a2b00;
    font-size: 22px;
  }

  .tag {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    display: inline-block;
  }

  .t-g {
    background: #d6f5e0;
    color: #0e622b;
  }

  .t-y {
    background: var(--yellow);
    color: #3a2b00;
  }

  .t-o {
    background: #ffe3d9;
    color: #992603;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .row b {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink);
  }

  .meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    font-size: 12px;
    color: var(--mute);
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--line);
  }

  .meta b {
    display: block;
    color: var(--ink);
    font-size: 13px;
  }

  .ai {
    background: var(--ink);
    color: var(--bg);
    border-radius: 999px;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 600;
    display: inline-flex;
    gap: 8px;
    align-items: center;
  }

  section {
    padding: 70px 0 0;
  }

  .eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mute);
  }

  h2 {
    font-size: clamp(28px, 4vw, 44px);
    letter-spacing: -0.035em;
    line-height: 1.1;
    margin: 10px 0 14px;
    color: var(--ink);
    font-weight: 700;
  }

  .grid4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-top: 28px;
  }

  .stat {
    transition:
      translate 0.25s ease,
      box-shadow 0.25s ease;
  }

  .stat:hover {
    translate: 0 -6px;
    box-shadow: 0 30px 60px -22px rgba(60, 40, 20, 0.38);
  }

  .stat .badge {
    margin-bottom: 22px;
  }

  .stat strong {
    font-size: 34px;
    letter-spacing: -0.03em;
    display: block;
    line-height: 1.1;
    color: var(--ink);
  }

  .stat small {
    color: var(--mute);
  }

  .stat-tilted {
    transform: rotate(1.5deg);
  }

  .feat {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-top: 28px;
  }

  .feat .card {
    transition:
      translate 0.25s ease,
      box-shadow 0.25s ease;
  }

  .feat .card:hover {
    translate: 0 -6px;
    box-shadow: 0 30px 60px -22px rgba(60, 40, 20, 0.38);
  }

  .feat h3 {
    font-size: 18px;
    letter-spacing: -0.02em;
    margin: 14px 0 6px;
    color: var(--ink);
    font-weight: 600;
  }

  .feat p {
    color: var(--mute);
    font-size: 14px;
  }

  .badge {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: var(--bg2);
    color: var(--ink);
    transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
  }

  .card:hover .badge {
    transform: rotate(-8deg) scale(1.1);
  }

  .b-o {
    background: #ffe3d9;
    color: #992603;
  }

  .b-y {
    background: var(--yellow);
    color: #3a2b00;
  }

  .b-g {
    background: #d6f5e0;
    color: #0e622b;
  }

  /* Observability Dashboard */
  .dash {
    display: grid;
    grid-template-columns: 70px 1fr 280px;
    margin-top: 28px;
    padding: 0;
    overflow: hidden;
  }

  .side {
    border-right: 1px solid var(--line);
    padding: 18px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .side span {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: var(--bg2);
    color: var(--mute);
  }

  .side span:first-child {
    background: var(--ink);
    color: var(--bg);
  }

  .main-dash {
    padding: 22px 24px;
  }

  .main-dash .top {
    display: flex;
    align-items: flex-end;
    gap: 16px;
  }

  .main-dash .top strong {
    font-size: 64px;
    letter-spacing: -0.05em;
    line-height: 0.9;
    color: var(--ink);
  }

  .main-dash small {
    color: var(--mute);
  }

  /* Pulsing live status dot */
  .live {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--green);
    align-self: center;
    flex: none;
    animation: ping 1.8s ease-out infinite;
  }

  @keyframes ping {
    0% {
      box-shadow: 0 0 0 0 rgba(31, 157, 76, 0.55);
    }
    100% {
      box-shadow: 0 0 0 12px rgba(31, 157, 76, 0);
    }
  }

  .bar {
    height: 34px;
    border-radius: 12px;
    margin-top: 16px;
    background: linear-gradient(
      90deg,
      #ff8a80,
      #ffd966 45%,
      #8fe38f 75%,
      var(--bg2) 75%
    );
  }

  .list {
    margin-top: 18px;
  }

  .li {
    display: grid;
    grid-template-columns: 44px 1fr auto auto;
    gap: 12px;
    align-items: center;
    font-size: 13px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
    color: var(--ink);
  }

  .li code {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12px;
  }

  .li small {
    display: block;
    color: var(--mute);
  }

  .meth {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 8px;
    background: var(--bg2);
    text-align: center;
    color: var(--ink);
  }

  .petal {
    border-left: 1px solid var(--line);
    padding: 22px;
    font-size: 12px;
  }

  .petal b {
    color: var(--ink);
  }

  .pet {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-top: 14px;
  }

  .pet div {
    border-radius: 16px;
    padding: 14px 8px;
    text-align: center;
    color: #2b1d00;
    font-size: 11px;
  }

  .pet b {
    display: block;
    font-size: 14px;
    margin-bottom: 2px;
  }

  .note {
    font-size: 12px;
    color: var(--mute);
    margin-top: 12px;
  }

  /* Get Started (Mulai) */
  .start {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 28px;
  }

  .codewrap {
    position: relative;
    display: flex;
  }

  .term-box {
    flex: 1;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 13px;
    background: var(--ink);
    color: var(--bg);
    border-radius: 18px;
    padding: 20px;
    overflow-x: auto;
    line-height: 1.8;
    margin: 0;
  }

  .term-box i {
    font-style: normal;
    opacity: 0.5;
  }

  .copy-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: 0;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.12);
    color: var(--bg);
    display: grid;
    place-items: center;
    transition:
      background 0.2s,
      transform 0.2s;
  }

  .copy-btn:hover {
    background: rgba(255, 255, 255, 0.22);
    transform: scale(1.08);
  }

  .steps {
    display: grid;
    gap: 12px;
    align-content: start;
  }

  .steps div {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .steps h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
  }

  .steps p {
    font-size: 13px;
    color: var(--mute);
  }

  /* Final CTA */
  .final {
    margin: 70px 0 40px;
    padding: 56px 24px;
    border-radius: 28px;
    text-align: center;
    background: var(--ink);
    color: var(--bg);
  }

  .final h2 {
    color: var(--bg);
    margin: 0 auto 14px;
  }

  .final .btn {
    background: var(--bg);
    color: var(--ink);
  }

  /* Footer */
  .stitch-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 18px 0 30px;
    font-size: 13px;
    color: var(--mute);
  }

  .cr {
    flex-basis: 100%;
    margin-top: 6px;
    padding-top: 16px;
    border-top: 1px solid var(--line);
    font-size: 12px;
  }

  /* Responsive Rules */
  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
      padding: 32px 0 10px;
    }
    .links {
      display: none;
    }
    .mobile-toggle {
      display: grid;
    }
    .stack {
      min-height: 470px;
    }
    .grid4,
    .feat {
      grid-template-columns: 1fr 1fr;
    }
    .dash,
    .start {
      grid-template-columns: 1fr;
    }
    .side {
      display: none;
    }
    .petal {
      border-left: 0;
      border-top: 1px solid var(--line);
    }
    section {
      padding: 56px 0 0;
    }
    .big strong {
      font-size: 64px;
    }
  }

  @media (max-width: 560px) {
    .grid4,
    .feat {
      grid-template-columns: 1fr;
    }
    .nav-cta {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .blob,
    .live,
    .c1,
    .c2,
    .c3,
    .stitch-nav {
      animation: none !important;
      translate: none !important;
      transition: none !important;
    }
  }
</style>
