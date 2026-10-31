<script lang="ts">
  type Props = {
    id: string
    label: string
    placeholder?: string
    maxLength?: number
    autocomplete?: string
    error?: string
    disabled?: boolean
    value?: string
    oninput?: (event: Event) => void
  }

  let {
    id,
    label,
    placeholder,
    maxLength,
    autocomplete,
    error,
    disabled = false,
    value = $bindable(''),
    oninput,
  }: Props = $props()

  const errorId = $derived(`${id}-error`)
</script>

<div class="flex min-w-0 flex-1 flex-col gap-2">
  <label for={id} class="text-sm font-medium text-foreground">{label}</label>
  <input
    {id}
    type="text"
    bind:value
    maxlength={maxLength}
    {autocomplete}
    {placeholder}
    {disabled}
    oninput={oninput}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error ? errorId : undefined}
    class="min-h-11 min-w-0 rounded-lg border border-border bg-canvas px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
  />
  {#if error}
    <p id={errorId} role="alert" class="text-sm text-danger">{error}</p>
  {/if}
</div>
