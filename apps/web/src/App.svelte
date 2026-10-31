<script lang="ts">
  import GreetingPanel from './features/greeting/GreetingPanel.svelte'
  import StackOverview from './features/stack/StackOverview.svelte'
</script>

<svelte:head>
  <title>Honvelte Wind — Full-stack starter</title>
  <meta name="description" content="Svelte, Hono, Tailwind CSS 4, and Bun." />
</svelte:head>

<main class="min-h-screen bg-canvas px-6 py-16 text-foreground">
  <div class="mx-auto flex max-w-3xl flex-col gap-10">
    <header class="space-y-4">
      <p class="text-sm font-semibold tracking-[0.2em] text-accent uppercase">
        Bun-powered full stack
      </p>
      <h1 class="text-4xl font-bold tracking-tight sm:text-6xl">
        Honvelte Wind
      </h1>
      <p class="max-w-xl text-lg text-muted">
        Svelte 5, Hono, Tailwind CSS 4, and Bun. One codebase, clear boundaries,
        production-ready workflow.
      </p>
    </header>

    <GreetingPanel />
    <StackOverview />
  </div>
</main>
