<script lang="ts">
  import { greetingSchema, type GreetingResponse } from '@honvelte/contracts'
  import SendIcon from '~icons/lucide/send'
  import Button from '../../lib/components/ui/Button.svelte'
  import TextField from '../../lib/components/ui/TextField.svelte'
  import { sendGreeting } from './api'

  let name = $state('')
  let result = $state<GreetingResponse | null>(null)
  let validationError = $state('')
  let requestError = $state('')
  let loading = $state(false)

  function clearFeedback() {
    validationError = ''
    requestError = ''
    result = null
  }

  async function greet(event: SubmitEvent) {
    event.preventDefault()
    clearFeedback()

    const parsed = greetingSchema.safeParse({ name })
    if (!parsed.success) {
      validationError =
        parsed.error.issues[0]?.message ?? 'Please enter a valid name.'
      return
    }

    loading = true
    try {
      result = await sendGreeting(parsed.data)
    } catch (cause) {
      requestError =
        cause instanceof Error ? cause.message : 'Unexpected request error.'
    } finally {
      loading = false
    }
  }
</script>

<section
  aria-labelledby="greeting-title"
  class="rounded-2xl border border-border bg-panel p-6 shadow-2xl"
>
  <header>
    <h2 id="greeting-title" class="text-xl font-semibold">Test the API</h2>
    <p class="mt-2 text-sm text-muted">Send a greeting through the Hono API.</p>
  </header>

  <form
    class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
    onsubmit={greet}
  >
    <TextField
      id="name"
      label="Your name"
      bind:value={name}
      maxLength={80}
      autocomplete="name"
      placeholder="Enter your name"
      error={validationError}
      oninput={clearFeedback}
    />
    <Button type="submit" busy={loading}>
      {#if loading}
        Sending…
      {:else}
        Say hello
        <SendIcon aria-hidden="true" class="size-4" focusable="false" />
      {/if}
    </Button>
  </form>

  {#if requestError}
    <p
      role="alert"
      class="mt-4 rounded-lg border border-danger-border bg-danger-panel p-3 text-sm text-danger"
    >
      {requestError}
    </p>
  {/if}
  {#if result}
    <p
      role="status"
      class="mt-4 rounded-lg border border-success-border bg-success-panel p-3 text-sm text-success"
    >
      {result.message}
    </p>
  {/if}
</section>
