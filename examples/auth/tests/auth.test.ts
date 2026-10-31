import { Database } from 'bun:sqlite'
import { Hono } from 'hono'
import { afterEach, describe, expect, test } from 'bun:test'
import {
  requirePermission,
  type AuthorizationStore,
} from '../src/authorization'
import {
  createSessionAuth,
  requireCsrfProtection,
  SESSION_COOKIE_NAME,
} from '../src/http'
import { issueSessionForOidcIdentity } from '../src/oidc-identity'
import { createAuthRoutes } from '../src/routes'
import {
  SessionService,
  type SessionRecord,
  type SessionStore,
} from '../src/session'
import { SqliteSessionStore } from '../src/sqlite-session-store'
import type { AuthEnv } from '../src/http'

class MemorySessionStore implements SessionStore {
  readonly records = new Map<string, SessionRecord>()

  async create(record: SessionRecord): Promise<void> {
    this.records.set(record.id, record)
  }

  async findById(id: string): Promise<SessionRecord | undefined> {
    return this.records.get(id)
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id)
  }

  async deleteExpired(now: number): Promise<void> {
    for (const [id, record] of this.records) {
      if (record.expiresAt <= now) this.records.delete(id)
    }
  }
}

const databases: Database[] = []

function createDatabase() {
  const database = new Database(':memory:')
  databases.push(database)
  return database
}

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close()
  }
})

describe('SessionService', () => {
  test('stores only a verifier hash and resolves an opaque cookie token', async () => {
    const store = new MemorySessionStore()
    const sessions = new SessionService(store, { ttlMs: 60_000, now: () => 1_000 })

    const issued = await sessions.create('user-123')
    const [sessionId, secret] = issued.cookieValue.split('.')
    const persisted = store.records.get(sessionId!)

    expect(issued.cookieValue).toMatch(/^[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/)
    expect(persisted?.secretHash).toMatch(/^[a-f0-9]{64}$/)
    expect(persisted?.secretHash).not.toBe(secret)
    expect(JSON.stringify(persisted)).not.toContain(secret)

    await expect(sessions.resolve(issued.cookieValue)).resolves.toMatchObject({
      id: sessionId,
      userId: 'user-123',
      expiresAt: 61_000,
    })
  })

  test('rejects malformed and tampered session tokens', async () => {
    const sessions = new SessionService(new MemorySessionStore())
    const issued = await sessions.create('user-123')
    const [id, secret] = issued.cookieValue.split('.')

    await expect(sessions.resolve(undefined)).resolves.toBeNull()
    await expect(sessions.resolve('arbitrary-session-id')).resolves.toBeNull()
    await expect(
      sessions.resolve(id + '.' + 'A'.repeat(secret!.length)),
    ).resolves.toBeNull()
  })

  test('expires and removes sessions on resolution', async () => {
    const store = new MemorySessionStore()
    let now = 5_000
    const sessions = new SessionService(store, {
      ttlMs: 60_000,
      now: () => now,
    })
    const issued = await sessions.create('user-123')
    const id = issued.cookieValue.split('.')[0]!

    now = 65_000

    await expect(sessions.resolve(issued.cookieValue)).resolves.toBeNull()
    expect(store.records.has(id)).toBe(false)
  })

  test('revokes a session on logout', async () => {
    const store = new MemorySessionStore()
    const sessions = new SessionService(store)
    const issued = await sessions.create('user-123')
    const id = issued.cookieValue.split('.')[0]!

    await sessions.revoke(id)

    await expect(sessions.resolve(issued.cookieValue)).resolves.toBeNull()
  })
})

describe('SQLite session store', () => {
  test('persists verifier records and removes expired sessions', async () => {
    const database = createDatabase()
    const store = new SqliteSessionStore(database)
    const sessions = new SessionService(store, {
      ttlMs: 60_000,
      now: () => 10_000,
    })
    const issued = await sessions.create('user-sqlite')

    await expect(sessions.resolve(issued.cookieValue)).resolves.toMatchObject({
      userId: 'user-sqlite',
    })

    await store.deleteExpired(70_000)

    await expect(sessions.resolve(issued.cookieValue)).resolves.toBeNull()
  })
})

describe('Hono authentication and authorization middleware', () => {
  test('requires a valid session and returns only the internal user ID', async () => {
    const sessions = new SessionService(new MemorySessionStore())
    const issued = await sessions.create('user-123')
    const app = new Hono<AuthEnv>()

    app.use('/private/*', createSessionAuth(sessions, { secure: false }))
    app.get('/private/session', (context) =>
      context.json({ userId: context.get('authSession').userId }),
    )

    const anonymous = await app.request('/private/session')
    expect(anonymous.status).toBe(401)

    const authenticated = await app.request('/private/session', {
      headers: {
        cookie: SESSION_COOKIE_NAME + '=' + issued.cookieValue,
      },
    })
    expect(authenticated.status).toBe(200)
    expect(await authenticated.json()).toEqual({ userId: 'user-123' })
    expect(authenticated.headers.get('cache-control')).toBe('no-store')
  })

  test('enforces permissions from the server-side authorization store', async () => {
    const sessions = new SessionService(new MemorySessionStore())
    const issued = await sessions.create('user-reader')
    const authorization: AuthorizationStore = {
      async getPermissionsForUser(userId) {
        return userId === 'user-reader'
          ? new Set(['reports:read'])
          : new Set<string>()
      },
    }
    const app = new Hono<AuthEnv>()

    app.use('/private/*', createSessionAuth(sessions, { secure: false }))
    app.get(
      '/private/reports',
      requirePermission('reports:read', authorization),
      (context) => context.json({ reports: [] }),
    )
    app.get(
      '/private/admin',
      requirePermission('users:manage', authorization),
      (context) => context.json({ users: [] }),
    )

    const headers = {
      cookie: SESSION_COOKIE_NAME + '=' + issued.cookieValue,
    }

    expect(
      (await app.request('/private/reports', { headers })).status,
    ).toBe(200)
    expect(
      (await app.request('/private/admin', { headers })).status,
    ).toBe(403)
  })

  test('requires an exact Origin and matching synchronizer token on mutations', async () => {
    const sessions = new SessionService(new MemorySessionStore())
    const issued = await sessions.create('user-123')
    const app = new Hono<AuthEnv>()

    app.use('/private/*', createSessionAuth(sessions, { secure: false }))
    app.post(
      '/private/mutate',
      requireCsrfProtection('https://app.example.test'),
      (context) => context.json({ changed: true }),
    )

    const cookie = SESSION_COOKIE_NAME + '=' + issued.cookieValue
    const validHeaders = {
      cookie,
      origin: 'https://app.example.test',
      'x-csrf-token': issued.session.csrfToken,
    }

    expect(
      (
        await app.request('/private/mutate', {
          method: 'POST',
          headers: { ...validHeaders, origin: 'https://attacker.example' },
        })
      ).status,
    ).toBe(403)

    expect(
      (
        await app.request('/private/mutate', {
          method: 'POST',
          headers: { ...validHeaders, 'x-csrf-token': 'invalid' },
        })
      ).status,
    ).toBe(403)

    expect(
      (
        await app.request('/private/mutate', {
          method: 'POST',
          headers: validHeaders,
        })
      ).status,
    ).toBe(200)
  })
})

describe('Auth routes', () => {
  test('exposes a CSRF token and revokes the server session on logout', async () => {
    const sessions = new SessionService(new MemorySessionStore())
    const issued = await sessions.create('user-123')
    const app = new Hono()

    app.route(
      '/api/auth',
      createAuthRoutes(sessions, {
        cookie: { secure: false },
        appOrigin: 'https://app.example.test',
      }),
    )

    const cookie = SESSION_COOKIE_NAME + '=' + issued.cookieValue
    const csrfResponse = await app.request('/api/auth/csrf', {
      headers: { cookie },
    })

    expect(csrfResponse.status).toBe(200)
    expect(await csrfResponse.json()).toEqual({
      csrfToken: issued.session.csrfToken,
    })

    const logout = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: {
        cookie,
        origin: 'https://app.example.test',
        'x-csrf-token': issued.session.csrfToken,
      },
    })

    expect(logout.status).toBe(200)
    expect(logout.headers.get('set-cookie')).toContain('Max-Age=0')

    const afterLogout = await app.request('/api/auth/session', {
      headers: { cookie },
    })
    expect(afterLogout.status).toBe(401)
  })
})

describe('OIDC identity boundary', () => {
  test('resolves an internal account by issuer and subject, not email', async () => {
    const sessions = new SessionService(new MemorySessionStore())
    const identities = new Map<string, string>()
    let nextUserId = 0

    const identityStore = {
      async findOrCreateUserId(identity: { issuer: string; subject: string }) {
        const key = identity.issuer + '|' + identity.subject
        const existing = identities.get(key)
        if (existing) return existing

        const userId = 'oidc-user-' + ++nextUserId
        identities.set(key, userId)
        return userId
      },
    }

    const first = await issueSessionForOidcIdentity(
      {
        issuer: 'https://identity.example.test/',
        subject: 'subject-1',
        email: 'person@example.test',
        emailVerified: true,
      },
      identityStore,
      sessions,
    )
    const second = await issueSessionForOidcIdentity(
      {
        issuer: 'https://identity.example.test',
        subject: 'subject-1',
        email: 'changed@example.test',
        emailVerified: true,
      },
      identityStore,
      sessions,
    )

    await expect(sessions.resolve(first.cookieValue)).resolves.toMatchObject({
      userId: 'oidc-user-1',
    })
    await expect(sessions.resolve(second.cookieValue)).resolves.toMatchObject({
      userId: 'oidc-user-1',
    })
  })

  test('rejects non-HTTPS OIDC issuers', async () => {
    const sessions = new SessionService(new MemorySessionStore())

    await expect(
      issueSessionForOidcIdentity(
        { issuer: 'http://identity.example.test', subject: 'subject-1' },
        {
          async findOrCreateUserId() {
            return 'user-123'
          },
        },
        sessions,
      ),
    ).rejects.toThrow('OIDC issuer and subject are not valid')
  })
})
