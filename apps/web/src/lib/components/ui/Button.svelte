<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    children: Snippet
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    busy?: boolean
  }

  let {
    children,
    type = 'button',
    disabled = false,
    busy = false,
  }: Props = $props()
</script>

<button
  {type}
  disabled={disabled || busy}
  aria-busy={busy ? 'true' : undefined}
  class="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
>
  <span class="inline-flex items-center justify-center gap-2">
    {@render children()}
  </span>
</button>
