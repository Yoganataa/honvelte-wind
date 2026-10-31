import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { MiddlewareHandler } from 'hono'

export type RequestDeadlineEnv = {
  Variables: {
    requestSignal: AbortSignal
    requestDeadlineAt: number
  }
}

export type DeadlineTimer = {
  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>
  clearTimeout(timer: ReturnType<typeof setTimeout>): void
}

const systemTimer: DeadlineTimer = {
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (timer) => clearTimeout(timer),
}

export function createRequestDeadline(
  durationMs: number,
  timer: DeadlineTimer = systemTimer,
): MiddlewareHandler<RequestDeadlineEnv> {
  if (!Number.isSafeInteger(durationMs) || durationMs < 1) {
    throw new RangeError('Request deadline must be a positive integer in milliseconds.')
  }

  return async (context, next) => {
    const controller = new AbortController()
    const clientSignal = context.req.raw.signal
    const deadlineAt = Date.now() + durationMs

    const abortFromClient = () => {
      controller.abort(
        clientSignal.reason ??
          new DOMException('Client disconnected.', 'AbortError'),
      )
    }

    if (clientSignal.aborted) {
      abortFromClient()
    } else {
      clientSignal.addEventListener('abort', abortFromClient, { once: true })
    }

    context.set('requestSignal', controller.signal)
    context.set('requestDeadlineAt', deadlineAt)

    let timerHandle: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timerHandle = timer.setTimeout(() => {
        const reason = new DOMException(
          'Request deadline exceeded.',
          'TimeoutError',
        )
        controller.abort(reason)
        reject(
          new HTTPException(504, {
            message: 'Request deadline exceeded.',
          }),
        )
      }, durationMs)
    })

    try {
      await Promise.race([next(), timeoutPromise])
    } finally {
      if (timerHandle !== undefined) timer.clearTimeout(timerHandle)
      clientSignal.removeEventListener('abort', abortFromClient)
    }
  }
}

/**
 * Pass the returned signal to cancellable downstream work, for example:
 * fetch(url, { signal: context.get('requestSignal') }).
 */
export function getRequestSignal(
  context: Context<RequestDeadlineEnv>,
): AbortSignal {
  return context.get('requestSignal')
}
