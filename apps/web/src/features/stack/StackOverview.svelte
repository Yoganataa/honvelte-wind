<script lang="ts">
  const stack = [
    { title: 'Frontend', detail: 'Svelte 5 + Vite' },
    { title: 'Backend', detail: 'Hono + Bun' },
    { title: 'Styling', detail: 'Tailwind CSS 4' },
  ]
</script>

<section aria-label="Technology stack" class="grid gap-3 sm:grid-cols-3">
  {#each stack as item (item.title)}
    <article class="rounded-xl border border-border bg-panel-muted p-4">
      <h2 class="font-medium text-foreground">{item.title}</h2>
      <p class="mt-1 text-sm text-muted">{item.detail}</p>
    </article>
  {/each}
</section>
