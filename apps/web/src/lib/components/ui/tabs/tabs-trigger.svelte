<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui'
  import { cn } from '$lib/utils.js'

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: TabsPrimitive.TriggerProps = $props()
</script>

<TabsPrimitive.Trigger
  bind:ref
  data-slot="tabs-trigger"
  class={cn(
    'gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium transition-all relative inline-flex h-[calc(100%_-_1px)] flex-1 items-center justify-center whitespace-nowrap text-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
    'data-active:bg-surface data-active:text-foreground data-active:shadow-sm font-semibold',
    className,
  )}
  {...restProps}
/>
