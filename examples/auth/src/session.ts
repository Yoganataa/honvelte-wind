import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/
const SESSION_SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000

export type SessionRecord = {
  id: string
  userId: string
  secretHash: string
  csrfToken: string
  createdAt: number
  expiresAt: number
}

export type AuthSession = Omit<SessionRecord, 'secretHash' | 'csrfToken'> & {
  csrfToken: string
}

export type IssuedSession = {
  cookieValue: string
  session: AuthSession
}

export interface SessionStore {
  create(record: SessionRecord): Promise<void>
  findById(id: string): Promise<SessionRecord | undefined>
  delete(id: string): Promise<void>
  deleteExpired(now: number): Promise<void>
}

export type SessionServiceOptions = {
  ttlMs?: number
  now?: () => number
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function matchesHash(actual: string, expected: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(expected)) return false

  const actualBytes = Buffer.from(actual, 'hex')
  const expectedBytes = Buffer.from(expected, 'hex')

  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  )
}

export class SessionService {
  private readonly ttlMs: number
  private readonly now: () => number

  constructor(
    private readonly store: SessionStore,
    options: SessionServiceOptions = {},
  ) {
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS
    this.now = options.now ?? Date.now

    if (!Number.isSafeInteger(this.ttlMs) || this.ttlMs < 60_000) {
      throw new RangeError('Session TTL must be at least 60 seconds.')
    }
  }

  async create(userId: string): Promise<IssuedSession> {
    if (!userId.trim()) {
      throw new TypeError('A non-empty internal user ID is required.')
    }

    const now = this.now()
    const id = randomBytes(16).toString('base64url')
    const secret = randomBytes(32).toString('base64url')
    const csrfToken = randomBytes(32).toString('base64url')
    const record: SessionRecord = {
      id,
      userId,
      secretHash: sha256(secret),
      csrfToken,
      createdAt: now,
      expiresAt: now + this.ttlMs,
    }

    await this.store.deleteExpired(now)
    await this.store.create(record)

    return {
      cookieValue: id + '.' + secret,
      session: {
        id: record.id,
        userId: record.userId,
        csrfToken: record.csrfToken,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
      },
    }
  }

  async resolve(cookieValue: string | undefined): Promise<AuthSession | null> {
    if (!cookieValue) return null

    const [id, secret, ...extra] = cookieValue.split('.')
    if (
      extra.length !== 0 ||
      !id ||
      !secret ||
      !SESSION_ID_PATTERN.test(id) ||
      !SESSION_SECRET_PATTERN.test(secret)
    ) {
      return null
    }

    const record = await this.store.findById(id)
    if (!record) return null

    if (record.expiresAt <= this.now()) {
      await this.store.delete(id)
      return null
    }

    if (!matchesHash(sha256(secret), record.secretHash)) return null

    return {
      id: record.id,
      userId: record.userId,
      csrfToken: record.csrfToken,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    }
  }

  async revoke(sessionId: string): Promise<void> {
    await this.store.delete(sessionId)
  }
}
