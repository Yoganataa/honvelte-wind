export type RuntimeLifecycle = {
  isReady(): boolean
  beginShutdown(): void
}

export function createRuntimeLifecycle(): RuntimeLifecycle {
  let ready = true

  return {
    isReady: () => ready,
    beginShutdown: () => {
      ready = false
    },
  }
}
