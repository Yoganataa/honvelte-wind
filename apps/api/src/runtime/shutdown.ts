export type StoppableServer = {
  stop(closeActiveConnections?: boolean): Promise<void>
}

export type ShutdownTimer = {
  setTimeout(
    callback: () => void,
    delayMs: number,
  ): ReturnType<typeof setTimeout>
  clearTimeout(timer: ReturnType<typeof setTimeout>): void
}

const systemTimer: ShutdownTimer = {
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (timer) => clearTimeout(timer),
}

export type ShutdownOutcome = 'graceful' | 'forced'

export async function stopServerGracefully(
  server: StoppableServer,
  gracePeriodMs: number,
  timer: ShutdownTimer = systemTimer,
): Promise<ShutdownOutcome> {
  if (!Number.isSafeInteger(gracePeriodMs) || gracePeriodMs < 0) {
    throw new RangeError('Shutdown grace period must be a non-negative integer.')
  }

  let timerHandle: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<ShutdownOutcome>((resolve) => {
    timerHandle = timer.setTimeout(
      () => resolve('forced'),
      gracePeriodMs,
    )
  })

  try {
    const outcome = await Promise.race([
      server.stop().then(() => 'graceful' as const),
      timeoutPromise,
    ])

    if (outcome === 'forced') {
      await server.stop(true)
    }

    return outcome
  } finally {
    if (timerHandle !== undefined) timer.clearTimeout(timerHandle)
  }
}
