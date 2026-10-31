import type { Context, MiddlewareHandler } from 'hono'

export type RateLimitDecision = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
}

export type RateLimitRequest = {
  key: string
  now: number
  limit: number
  windowMs: number
}

export interface RateLimitStore {
  consume(request: RateLimitRequest): Promise<RateLimitDecision>
}

export class RateLimitCapacityError extends Error {
  constructor() {
    super('In-memory rate-limit store reached its configured capacity.')
    this.name = 'RateLimitCapacityError'
  }
}

type WindowCounter = {
  count: number
  resetAt: number
}

/**
 * Single-process fixed-window store. It is deliberately bounded and is not
 * suitable for multiple Bun workers, replicas, or serverless instances.
 */
export class InMemoryFixedWindowStore implements RateLimitStore {
  private readonly windows = new Map<string, WindowCounter>()

  constructor(private readonly maxKeys = 50_000) {
    if (!Number.isSafeInteger(maxKeys) || maxKeys < 1) {
      throw new RangeError('maxKeys must be a positive safe integer.')
    }
  }

  async consume(request: RateLimitRequest): Promise<RateLimitDecision> {
    const { key, now, limit, windowMs } = request
    const windowStart = Math.floor(now / windowMs) * windowMs
    const resetAt = windowStart + windowMs
    let counter = this.windows.get(key)

    if (!counter || counter.resetAt <= now) {
      if (!counter && this.windows.size >= this.maxKeys) {
        this.prune(now)
      }

      if (!counter && this.windows.size >= this.maxKeys) {
        throw new RateLimitCapacityError()
      }

      counter = { count: 0, resetAt }
      this.windows.set(key, counter)
    }

    counter.count += 1
    const remaining = Math.max(0, limit - counter.count)

    return {
      allowed: counter.count <= limit,
      limit,
      remaining,
      resetAt: counter.resetAt,
    }
  }

  private prune(now: number): void {
    for (const [key, counter] of this.windows) {
      if (counter.resetAt <= now) this.windows.delete(key)
    }
  }

  get size(): number {
    return this.windows.size
  }
}

export type RateLimitOptions = {
  limit: number
  windowMs: number
  store: RateLimitStore
  /**
   * Return a trusted principal key, such as an authenticated internal user ID.
   * Do not read X-Forwarded-For unless a trusted ingress overwrites it.
   */
  key: (context: Context) => string
  scope?: string
  now?: () => number
}

function validateOptions(options: RateLimitOptions): void {
  if (!Number.isSafeInteger(options.limit) || options.limit < 1) {
    throw new RangeError('Rate-limit limit must be a positive safe integer.')
  }

  if (
    !Number.isSafeInteger(options.windowMs) ||
    options.windowMs < 1_000 ||
    options.windowMs > 86_400_000
  ) {
    throw new RangeError('Rate-limit window must be between 1 second and 24 hours.')
  }

  if (options.scope !== undefined && !options.scope.trim()) {
    throw new TypeError('Rate-limit scope must not be empty.')
  }
}

export function createRateLimit(
  options: RateLimitOptions,
): MiddlewareHandler {
  validateOptions(options)
  const now = options.now ?? Date.now
  const scope = options.scope ?? 'default'

  return async (context, next) => {
    const principalKey = options.key(context)

    if (!principalKey.trim()) {
      throw new TypeError('Rate-limit key selector returned an empty key.')
    }

    const currentTime = now()
    let decision: RateLimitDecision
    try {
      decision = await options.store.consume({
        key: JSON.stringify([scope, principalKey]),
        now: currentTime,
        limit: options.limit,
        windowMs: options.windowMs,
      })
    } catch (error) {
      if (!(error instanceof RateLimitCapacityError)) throw error

      context.header('Retry-After', '1')
      return context.json(
        {
          error: {
            code: 'RATE_LIMIT_UNAVAILABLE',
            message: 'Rate-limit capacity is temporarily unavailable.',
          },
        },
        503,
      )
    }

    const resetSeconds = Math.max(
      0,
      Math.ceil((decision.resetAt - currentTime) / 1_000),
    )

    context.header('RateLimit-Limit', String(decision.limit))
    context.header('RateLimit-Remaining', String(decision.remaining))
    context.header('RateLimit-Reset', String(resetSeconds))

    if (!decision.allowed) {
      context.header('Retry-After', String(Math.max(1, resetSeconds)))
      return context.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Try again later.',
          },
        },
        429,
      )
    }

    await next()
  }
}
