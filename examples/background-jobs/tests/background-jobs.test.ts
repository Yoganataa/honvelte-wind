import { afterEach, describe, expect, test } from 'bun:test'
import { Database } from 'bun:sqlite'
import { z } from 'zod'
import {
  calculateRetryDelaySeconds,
  createCloudflareQueueHandler,
  createJob,
  createScheduledJob,
  D1IdempotencyStore,
  JobEnvelopeSchema,
  defineJobHandler,
  type D1DatabaseLike,
  type D1PreparedStatementLike,
  type IdempotencyStore,
  processJob,
  UnknownJobTypeError,
} from '../src'

class TestD1Statement implements D1PreparedStatementLike {
  private values: (string | number | null)[] = []

  constructor(
    private readonly database: Database,
    private readonly query: string,
  ) {}

  bind(...values: (string | number | null)[]): D1PreparedStatementLike {
    this.values = values
    return this
  }

  async first<T>(): Promise<T | null> {
    const row = this.database.query(this.query).get(...(this.values as never[]))
    return (row ?? null) as T | null
  }

  async run(): Promise<{ success: boolean; meta: { changes: number } }> {
    const result = this.database.run(this.query, ...(this.values as never[]))
    return { success: true, meta: { changes: result.changes } }
  }
}

class TestD1 implements D1DatabaseLike {
  constructor(private readonly database: Database) {}

  prepare(query: string): D1PreparedStatementLike {
    return new TestD1Statement(this.database, query)
  }
}

async function createStore(retentionMs = 60_000) {
  const database = new Database(':memory:')
  const migration = await Bun.file(
    new URL('../migrations/0001_idempotency.sql', import.meta.url),
  ).text()
  database.exec(migration)

  let tokenSequence = 0
  const store = new D1IdempotencyStore(new TestD1(database), {
    completedRetentionMs: retentionMs,
    tokenFactory: () => 'lease-' + String(++tokenSequence),
  })

  return { database, store }
}

const fixedTime = '2026-11-01T00:00:00.000Z'
const openDatabases: Database[] = []

afterEach(() => {
  for (const database of openDatabases.splice(0)) database.close()
})

describe('background job contracts and runner', () => {
  test('creates validated envelopes and stable scheduled identities', () => {
    const first = createScheduledJob('reports.refresh', 1_796_083_200_000, {
      reportId: 'report-1',
    })
    const second = createScheduledJob('reports.refresh', 1_796_083_200_000, {
      reportId: 'report-1',
    })

    expect(first.id).toBe(second.id)
    expect(first.createdAt).toBe('2026-12-01T00:00:00.000Z')
    expect(() =>
      createJob({ id: 'bad id', type: 'Reports.Refresh', payload: {} }),
    ).toThrow()
    expect(() => createScheduledJob('reports.refresh', -1, {})).toThrow()
    expect(() =>
      createJob({
        id: 'undefined-payload',
        type: 'reports.refresh',
        payload: undefined,
        createdAt: fixedTime,
      }),
    ).toThrow()
    expect(() =>
      JobEnvelopeSchema.parse({
        id: 'missing-payload',
        type: 'reports.refresh',
        createdAt: fixedTime,
      }),
    ).toThrow()
  })

  test('validates handler payloads and skips completed duplicates', async () => {
    const { database, store } = await createStore()
    openDatabases.push(database)
    let executions = 0
    const handler = defineJobHandler(
      z.object({ accountId: z.string().min(1) }),
      async (payload, context) => {
        expect(context.idempotencyKey).toBe('job-1')
        expect(payload.accountId).toBe('account-1')
        executions += 1
      },
    )
    const job = createJob({
      id: 'job-1',
      type: 'account.reconcile',
      payload: { accountId: 'account-1' },
      createdAt: fixedTime,
    })

    expect(
      await processJob(job, handler, {
        store,
        leaseMs: 10_000,
        now: () => 100,
      }),
    ).toBe('completed')
    expect(
      await processJob(job, handler, {
        store,
        leaseMs: 10_000,
        now: () => 200,
      }),
    ).toBe('duplicate')
    expect(executions).toBe(1)

    await expect(
      handler.run(
        { accountId: 123 },
        {
          jobId: 'bad',
          jobType: 'account.reconcile',
          idempotencyKey: 'bad',
          createdAt: fixedTime,
        },
      ),
    ).rejects.toThrow()
  })

  test('does not concurrently execute the same idempotency key', async () => {
    const { database, store } = await createStore()
    openDatabases.push(database)
    let executions = 0
    const job = createJob({
      id: 'concurrent-1',
      type: 'reports.refresh',
      payload: {},
      createdAt: fixedTime,
    })
    const handler = defineJobHandler(z.object({}), async () => {
      executions += 1
      await Promise.resolve()
    })

    const results = await Promise.all([
      processJob(job, handler, { store, leaseMs: 10_000, now: () => 100 }),
      processJob(job, handler, { store, leaseMs: 10_000, now: () => 100 }),
    ])

    expect(results.sort()).toEqual(['busy', 'completed'])
    expect(executions).toBe(1)
  })

  test('releases a failed lease so the provider can retry the job', async () => {
    const { database, store } = await createStore()
    openDatabases.push(database)
    const job = createJob({
      id: 'retry-1',
      type: 'reports.refresh',
      payload: {},
      createdAt: fixedTime,
    })
    let executions = 0
    const handler = defineJobHandler(z.object({}), async () => {
      executions += 1
      if (executions === 1) throw new Error('temporary failure')
    })

    await expect(
      processJob(job, handler, { store, leaseMs: 10_000, now: () => 100 }),
    ).rejects.toThrow('temporary failure')
    expect(
      await processJob(job, handler, {
        store,
        leaseMs: 10_000,
        now: () => 200,
      }),
    ).toBe('completed')
    expect(executions).toBe(2)
  })

  test('fences stale leases and purges expired records', async () => {
    const { database, store } = await createStore(60_000)
    openDatabases.push(database)

    const expiredOnly = await store.claim({
      key: 'expired-only',
      now: 100,
      leaseExpiresAt: 200,
    })
    expect(expiredOnly.status).toBe('acquired')
    if (expiredOnly.status !== 'acquired') {
      throw new Error('Expected expiring lease')
    }
    expect(
      await store.complete({
        key: 'expired-only',
        token: expiredOnly.token,
        completedAt: 200,
      }),
    ).toBe(false)

    const first = await store.claim({
      key: 'fenced-1',
      now: 100,
      leaseExpiresAt: 200,
    })
    expect(first.status).toBe('acquired')
    if (first.status !== 'acquired') throw new Error('Expected first lease')

    const second = await store.claim({
      key: 'fenced-1',
      now: 200,
      leaseExpiresAt: 300,
    })
    expect(second.status).toBe('acquired')
    if (second.status !== 'acquired') throw new Error('Expected second lease')

    expect(
      await store.complete({
        key: 'fenced-1',
        token: first.token,
        completedAt: 201,
      }),
    ).toBe(false)
    await store.release({ key: 'fenced-1', token: first.token })
    expect(
      await store.claim({ key: 'fenced-1', now: 201, leaseExpiresAt: 301 }),
    ).toEqual({ status: 'busy' })

    expect(
      await store.complete({
        key: 'fenced-1',
        token: second.token,
        completedAt: 250,
      }),
    ).toBe(true)
    expect(await store.purgeExpired({ now: 60_250 })).toBe(2)
    expect(
      await store.claim({
        key: 'fenced-1',
        now: 60_250,
        leaseExpiresAt: 60_350,
      }),
    ).toMatchObject({
      status: 'acquired',
    })
  })

  test('calculates bounded full-jitter retry delays', () => {
    expect(
      calculateRetryDelaySeconds(1, {
        baseDelaySeconds: 5,
        maxDelaySeconds: 20,
        random: () => 0,
      }),
    ).toBe(1)
    expect(
      calculateRetryDelaySeconds(10, {
        baseDelaySeconds: 5,
        maxDelaySeconds: 20,
        random: () => 0.999,
      }),
    ).toBe(20)
    expect(() => calculateRetryDelaySeconds(0)).toThrow()
    expect(() => calculateRetryDelaySeconds(1, { random: () => 1 })).toThrow()
  })

  test('retries invalid and unknown messages; acknowledges completed jobs', async () => {
    const { database, store } = await createStore()
    openDatabases.push(database)
    const job = createJob({
      id: 'queue-1',
      type: 'reports.refresh',
      payload: { reportId: 'r-1' },
      createdAt: fixedTime,
    })
    let executions = 0
    const handler = defineJobHandler(
      z.object({ reportId: z.string() }),
      async () => {
        executions += 1
      },
    )
    const actions: string[] = []
    const makeMessage = (id: string, body: unknown, attempts = 1) => ({
      id,
      body,
      attempts,
      ack: () => actions.push(id + ':ack'),
      retry: (options?: { delaySeconds?: number }) =>
        actions.push(id + ':retry:' + String(options?.delaySeconds)),
    })
    const queue = createCloudflareQueueHandler({
      store,
      handlers: new Map([['reports.refresh', handler]]),
      leaseMs: 10_000,
      now: () => 100,
      retryPolicy: { baseDelaySeconds: 5, random: () => 0 },
      onFailure: ({ error }) => {
        if (
          !(error instanceof UnknownJobTypeError) &&
          !(error instanceof Error)
        ) {
          throw new Error('unexpected failure type')
        }
      },
    })

    await queue({
      messages: [
        makeMessage('valid', job),
        makeMessage('invalid', { id: 'bad', type: 'Bad Type' }),
        makeMessage('unknown', {
          ...job,
          id: 'unknown-1',
          type: 'missing.handler',
        }),
      ],
    })

    expect([...actions].sort()).toEqual([
      'invalid:retry:1',
      'unknown:retry:1',
      'valid:ack',
    ])
    expect(executions).toBe(1)

    actions.length = 0
    await queue({ messages: [makeMessage('duplicate', job)] })
    expect(actions).toEqual(['duplicate:ack'])
    expect(executions).toBe(1)
  })

  test('bounds message concurrency within a delivered batch', async () => {
    let active = 0
    let peakActive = 0
    let executions = 0
    const acknowledgements: string[] = []
    const store: IdempotencyStore = {
      claim: async ({ key }) => ({ status: 'acquired', token: key }),
      complete: async () => true,
      release: async () => {},
    }
    const handler = defineJobHandler(z.object({}), async () => {
      active += 1
      peakActive = Math.max(peakActive, active)
      await Promise.resolve()
      active -= 1
      executions += 1
    })
    const queue = createCloudflareQueueHandler({
      store,
      handlers: new Map([['reports.refresh', handler]]),
      leaseMs: 10_000,
      concurrency: 2,
      now: () => 100,
    })

    await queue({
      messages: Array.from({ length: 7 }, (_, index) => ({
        id: 'bounded-' + String(index),
        body: createJob({
          id: 'bounded-' + String(index),
          type: 'reports.refresh',
          payload: {},
          createdAt: fixedTime,
        }),
        attempts: 1,
        ack: () => acknowledgements.push('ack'),
        retry: () => acknowledgements.push('retry'),
      })),
    })

    expect(peakActive).toBe(2)
    expect(executions).toBe(7)
    expect(acknowledgements).toHaveLength(7)
    expect(acknowledgements.every((action) => action === 'ack')).toBe(true)
  })

  test('retries busy claims and failed handlers instead of acknowledging them', async () => {
    const { database, store } = await createStore()
    openDatabases.push(database)
    const job = createJob({
      id: 'busy-1',
      type: 'reports.refresh',
      payload: {},
      createdAt: fixedTime,
    })
    const actions: string[] = []
    const message = {
      id: 'busy',
      body: job,
      attempts: 2,
      ack: () => actions.push('ack'),
      retry: (options?: { delaySeconds?: number }) =>
        actions.push('retry:' + String(options?.delaySeconds)),
    }
    const busyStore: IdempotencyStore = {
      claim: async () => ({ status: 'busy' }),
      complete: async () => false,
      release: async () => {},
    }
    const busyQueue = createCloudflareQueueHandler({
      store: busyStore,
      handlers: new Map([
        ['reports.refresh', defineJobHandler(z.object({}), async () => {})],
      ]),
      leaseMs: 10_000,
    })

    await busyQueue({ messages: [message] })
    expect(actions).toEqual(['retry:2'])

    const failedQueue = createCloudflareQueueHandler({
      store,
      handlers: new Map([
        [
          'reports.refresh',
          defineJobHandler(z.object({}), async () => {
            throw new Error('temporary')
          }),
        ],
      ]),
      leaseMs: 10_000,
      now: () => 100,
      retryPolicy: { random: () => 0.5 },
    })
    await failedQueue({ messages: [message] })
    expect(actions[1]).toBe('retry:6')
  })
})
