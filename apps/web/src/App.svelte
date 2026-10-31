<script lang="ts">
  import { greetingSchema, type GreetingResponse } from '@honvelte/contracts'

  let name = $state('')
  let result = $state<GreetingResponse | null>(null)
  let error = $state('')
  let loading = $state(false)

  async function greet(event: SubmitEvent) {
    event.preventDefault()
    error = ''
    result = null

    const parsed = greetingSchema.safeParse({ name })
    if (!parsed.success) {
      error = parsed.error.issues[0]?.message ?? 'Please enter a valid name.'
      return
    }

    loading = true
    try {
      const response = await fetch('/api/greet', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error?.message ?? 'Request failed.')
      }

      result = payload as GreetingResponse
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Unexpected request error.'
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Honvelte Wind — Full-stack starter</title>
  <meta name="description" content="Svelte, Hono, Tailwind CSS 4, and Bun." />
</svelte:head>

<main class="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
  <div class="mx-auto flex max-w-3xl flex-col gap-10">
    <header class="space-y-4">
      <p class="text-sm font-semibold tracking-[0.2em] text-cyan-400 uppercase">Bun-powered full stack</p>
      <h1 class="text-4xl font-bold tracking-tight sm:text-6xl">Honvelte Wind</h1>
      <p class="max-w-xl text-lg text-zinc-400">
        Svelte 5, Hono, Tailwind CSS 4, and Bun. One codebase, clear boundaries, production-ready workflow.
      </p>
    </header>

    <section class="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl">
      <h2 class="text-xl font-semibold">Test the API</h2>
      <p class="mt-2 text-sm text-zinc-400">Send a greeting through the Hono API.</p>
      <form class="mt-6 flex flex-col gap-3 sm:flex-row" onsubmit={greet}>
        <label class="sr-only" for="name">Your name</label>
        <input
          id="name"
          bind:value={name}
          maxlength="80"
          placeholder="Enter your name"
          class="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading}
          class="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Say hello'}
        </button>
      </form>

      {#if error}
        <p role="alert" class="mt-4 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">{error}</p>
      {/if}
      {#if result}
        <p role="status" class="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-300">
          {result.message}
        </p>
      {/if}
    </section>

    <section class="grid gap-3 sm:grid-cols-3">
      {#each [{ title: 'Frontend', detail: 'Svelte 5 + Vite' }, { title: 'Backend', detail: 'Hono + Bun' }, { title: 'Styling', detail: 'Tailwind CSS 4' }] as item (item.title)}
        <div class="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p class="font-medium">{item.title}</p>
          <p class="mt-1 text-sm text-zinc-500">{item.detail}</p>
        </div>
      {/each}
    </section>
  </div>
</main>
