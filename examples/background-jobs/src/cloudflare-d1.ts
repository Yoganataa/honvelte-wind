import type {
  IdempotencyClaim,
  IdempotencyMaintenance,
  IdempotencyStore,
} from './idempotency-store'

type D1Value = string | number | null

export interface D1PreparedStatementLike {
  bind(...values: D1Value[]): D1PreparedStatementLike
  first<T = unknown>(): Promise<T | null>
  run(): Promise<{ success: boolean; meta?: { changes?: number } }>
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike
}

export type D1IdempotencyStoreOptions = {
  /** Keep completed keys longer than the queue retention and replay window. */
  completedRetentionMs: number
  tokenFactory?: () => string
}

/** Durable D1 idempotency storage using conditional SQL writes. */
export class D1IdempotencyStore
  implements IdempotencyStore, IdempotencyMaintenance
{
  private readonly tokenFactory: () => string

  constructor(
    private readonly database: D1DatabaseLike,
    private readonly options: D1IdempotencyStoreOptions,
  ) {
    if (
      !Number.isSafeInteger(options.completedRetentionMs) ||
      options.completedRetentionMs < 60_000
    ) {
      throw new RangeError(
        'completedRetentionMs must be at least 60000 milliseconds.',
      )
    }

    this.tokenFactory = options.tokenFactory ?? (() => crypto.randomUUID())
  }

  async claim(input: {
    key: string
    now: number
    leaseExpiresAt: number
  }): Promise<IdempotencyClaim> {
    validateKey(input.key)
    validateTimestamp(input.now, 'now')

    if (
      !Number.isSafeInteger(input.leaseExpiresAt) ||
      input.leaseExpiresAt <= input.now
    ) {
      throw new RangeError('leaseExpiresAt must be later than now.')
    }

    const token = this.tokenFactory()
    if (!token.trim() || token.length > 128) {
      throw new TypeError('The idempotency lease token is invalid.')
    }

    const claimed = await this.database
      .prepare(
        `INSERT INTO background_job_idempotency (
          idempotency_key, state, lease_token, lease_expires_at, completed_at, expires_at
        )
        VALUES (?, 'processing', ?, ?, NULL, NULL)
        ON CONFLICT(idempotency_key) DO UPDATE SET
          state = 'processing',
          lease_token = excluded.lease_token,
          lease_expires_at = excluded.lease_expires_at,
          completed_at = NULL,
          expires_at = NULL
        WHERE
          (
            background_job_idempotency.state = 'processing'
            AND background_job_idempotency.lease_expires_at <= ?
          )
          OR
          (
            background_job_idempotency.state = 'completed'
            AND background_job_idempotency.expires_at <= ?
          )
        RETURNING lease_token`,
      )
      .bind(input.key, token, input.leaseExpiresAt, input.now, input.now)
      .first<{ lease_token: string }>()

    if (claimed?.lease_token === token) {
      return { status: 'acquired', token }
    }

    const existing = await this.database
      .prepare(
        'SELECT state FROM background_job_idempotency WHERE idempotency_key = ?',
      )
      .bind(input.key)
      .first<{ state: 'processing' | 'completed' }>()

    return existing?.state === 'completed'
      ? { status: 'completed' }
      : { status: 'busy' }
  }

  async complete(input: {
    key: string
    token: string
    completedAt: number
  }): Promise<boolean> {
    validateKey(input.key)
    validateTimestamp(input.completedAt, 'completedAt')
    validateToken(input.token)

    const expiresAt = input.completedAt + this.options.completedRetentionMs
    if (!Number.isSafeInteger(expiresAt)) {
      throw new RangeError('The completed idempotency expiry is invalid.')
    }

    const result = await this.database
      .prepare(
        `UPDATE background_job_idempotency
        SET state = 'completed',
            lease_token = NULL,
            lease_expires_at = NULL,
            completed_at = ?,
            expires_at = ?
        WHERE idempotency_key = ?
          AND state = 'processing'
          AND lease_token = ?
          AND lease_expires_at > ?`,
      )
      .bind(
        input.completedAt,
        expiresAt,
        input.key,
        input.token,
        input.completedAt,
      )
      .run()

    return result.meta?.changes === 1
  }

  async release(input: { key: string; token: string }): Promise<void> {
    validateKey(input.key)
    validateToken(input.token)

    await this.database
      .prepare(
        `DELETE FROM background_job_idempotency
        WHERE idempotency_key = ?
          AND state = 'processing'
          AND lease_token = ?`,
      )
      .bind(input.key, input.token)
      .run()
  }

  async purgeExpired(input: { now: number; limit?: number }): Promise<number> {
    validateTimestamp(input.now, 'now')
    const limit = input.limit ?? 500

    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10_000) {
      throw new RangeError('purge limit must be between 1 and 10000.')
    }

    const result = await this.database
      .prepare(
        `DELETE FROM background_job_idempotency
        WHERE idempotency_key IN (
          SELECT idempotency_key
          FROM background_job_idempotency
          WHERE
            (state = 'completed' AND expires_at <= ?)
            OR
            (state = 'processing' AND lease_expires_at <= ?)
          ORDER BY COALESCE(expires_at, lease_expires_at)
          LIMIT ?
        )`,
      )
      .bind(input.now, input.now, limit)
      .run()

    return result.meta?.changes ?? 0
  }
}

function validateKey(key: string): void {
  if (
    typeof key !== 'string' ||
    key.length < 1 ||
    key.length > 128 ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(key)
  ) {
    throw new TypeError('The idempotency key is invalid.')
  }
}

function validateToken(token: string): void {
  if (typeof token !== 'string' || !token.trim() || token.length > 128) {
    throw new TypeError('The idempotency lease token is invalid.')
  }
}

function validateTimestamp(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(field + ' must be a non-negative safe integer.')
  }
}
