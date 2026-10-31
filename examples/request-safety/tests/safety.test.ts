import { Hono } from 'hono'
import { describe, expect, test } from 'bun:test'
import {
  InMemoryFixedWindowStore,
  RateLimitCapacityError,
  createRateLimit,
} from '../src/rate-limit'
import {
  createRequestDeadline,
  type DeadlineTimer,
  type RequestDeadlineEnv,
} from '../src/request-deadline'

describe('InMemoryFixedWindowStore', () => {
  test('counts requests within a fixed window and resets at the boundary', async () => {
    const store = new InMemoryFixedWindowStore()
    const request = {
      key: 'user-1',
      now: 1_000,
      limit: 2,
      windowMs: 1_000,
    }

    await expect(store.consume(request)).resolves.toMatchObject({
      allowed: true,
      remaining: 1,
      resetAt: 2_000,
    })
    await expect(store.consume(request)).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
      resetAt: 2_000,
    })
    await expect(store.consume(request)).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
      resetAt: 2_000,
    })
    await expect(
      store.consume({ ...request, now: 2_000 }),
    ).resolves.toMatchObject({
      allowed: true,
      remaining: 1,
      resetAt: 3_000,
    })
  })

  test('bounds key storage and prunes expired keys before rejecting new keys', async () => {
    const store = new InMemoryFixedWindowStore(1)
    const base = { now: 1_000, limit: 5, windowMs: 1_000 }

    await store.consume({ ...base, key: 'first' })
    await expect(
      store.consume({ ...base, key: 'second' }),
    ).rejects.toBeInstanceOf(RateLimitCapacityError)

    await expect(
      store.consume({ ...base, key: 'second', now: 2_000 }),
    ).resolves.toMatchObject({ allowed: true })
    expect(store.size).toBe(1)
  })
})

describe('createRateLimit', () => {
  test('returns rate limit headers and rejects requests over quota', async () => {
    const store = new InMemoryFixedWindowStore()
    let now = 5_000
    const app = new Hono()

    app.use(
      '/limited/*',
      createRateLimit({
        limit: 2,
        windowMs: 10_000,
        store,
        scope: 'reports:read',
        key: (context) => context.req.header('x-authenticated-user') ?? '',
        now: () => now,
      }),
    )
    app.get('/limited/reports', (context) => context.json({ reports: [] }))

    const headers = { 'x-authenticated-user': 'user-123' }
    const first = await app.request('/limited/reports', { headers })
    const second = await app.request('/limited/reports', { headers })
    const blocked = await app.request('/limited/reports', { headers })

    expect(first.status).toBe(200)
    expect(first.headers.get('ratelimit-policy')).toBe(
      '"reports:read";q=2;w=10',
    )
    expect(first.headers.get('ratelimit')).toBe(
      '"reports:read";r=1;t=5',
    )
    expect(second.headers.get('ratelimit')).toBe(
      '"reports:read";r=0;t=5',
    )
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('retry-after')).toBe('5')
    expect(await blocked.json()).toMatchObject({
      error: { code: 'RATE_LIMITED' },
    })

    now = 15_000
    const afterReset = await app.request('/limited/reports', { headers })
    expect(afterReset.status).toBe(200)
    expect(afterReset.headers.get('ratelimit')).toBe(
      '"reports:read";r=1;t=5',
    )
  })

  test('fails closed with 503 when the bounded in-memory store is full', async () => {
    const store = new InMemoryFixedWindowStore(1)
    const app = new Hono()

    app.use(
      '/limited/*',
      createRateLimit({
        limit: 10,
        windowMs: 10_000,
        store,
        key: (context) => context.req.header('x-authenticated-user') ?? '',
        now: () => 5_000,
      }),
    )
    app.get('/limited/data', (context) => context.text('ok'))

    await app.request('/limited/data', {
      headers: { 'x-authenticated-user': 'first' },
    })
    const second = await app.request('/limited/data', {
      headers: { 'x-authenticated-user': 'second' },
    })

    expect(second.status).toBe(503)
    expect(second.headers.get('retry-after')).toBe('1')
  })

  test('rejects unsafe structured-field policy names', () => {
    const store = new InMemoryFixedWindowStore()

    expect(() =>
      createRateLimit({
        limit: 5,
        windowMs: 1_000,
        store,
        scope: 'invalid"scope',
        key: () => 'user-1',
      }),
    ).toThrow('safe ASCII token characters')
  })

  test('rejects invalid options and an empty principal key', async () => {
    const store = new InMemoryFixedWindowStore()

    expect(() =>
      createRateLimit({
        limit: 0,
        windowMs: 1_000,
        store,
        key: () => 'user',
      }),
    ).toThrow('positive safe integer')

    const app = new Hono()
    app.use(
      '/limited/*',
      createRateLimit({
        limit: 5,
        windowMs: 1_000,
        store,
        key: () => ' ',
      }),
    )
    app.get('/limited/data', (context) => context.text('ok'))

    const response = await app.request('/limited/data')
    expect(response.status).toBe(500)
  })
})

describe('createRequestDeadline', () => {
  test('returns 504 and aborts downstream work when the deadline expires', async () => {
    let fireTimer: (() => void) | undefined
    let timerCleared = false
    let downstreamSignal: AbortSignal | undefined

    const timer: DeadlineTimer = {
      setTimeout(callback) {
        fireTimer = callback
        return 1 as unknown as ReturnType<typeof setTimeout>
      },
      clearTimeout() {
        timerCleared = true
      },
    }

    const app = new Hono<RequestDeadlineEnv>()
    app.use('/slow', createRequestDeadline(100, timer))
    app.get('/slow', async (context) => {
      downstreamSignal = context.get('requestSignal')
      await new Promise<void>(() => {
        // Simulate a downstream operation that only stops on abort.
        downstreamSignal?.addEventListener('abort', () => {}, { once: true })
      })
      return context.text('not reached')
    })

    const responsePromise = app.request('/slow')
    expect(fireTimer).toBeDefined()
    fireTimer?.()

    const response = await responsePromise
    expect(response.status).toBe(504)
    expect(downstreamSignal?.aborted).toBe(true)
    expect(timerCleared).toBe(true)
  })

  test('clears the timer when the route completes before the deadline', async () => {
    let timerCleared = false
    const timer: DeadlineTimer = {
      setTimeout() {
        return 2 as unknown as ReturnType<typeof setTimeout>
      },
      clearTimeout() {
        timerCleared = true
      },
    }

    const app = new Hono<RequestDeadlineEnv>()
    app.use('/fast', createRequestDeadline(100, timer))
    app.get('/fast', (context) => context.text('ok'))

    const response = await app.request('/fast')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('ok')
    expect(timerCleared).toBe(true)
  })

  test('rejects invalid timeout durations', () => {
    expect(() => createRequestDeadline(0)).toThrow(
      'positive integer in milliseconds',
    )
  })
})
