import type { Database } from 'bun:sqlite'
import type { SessionRecord, SessionStore } from './session'

type SessionRow = {
  id: string
  user_id: string
  secret_hash: string
  csrf_token: string
  created_at: number
  expires_at: number
}

export class SqliteSessionStore implements SessionStore {
  private readonly insert: ReturnType<Database['query']>
  private readonly find: ReturnType<Database['query']>
  private readonly remove: ReturnType<Database['query']>
  private readonly removeExpired: ReturnType<Database['query']>

  constructor(private readonly database: Database) {
    database.run(`
      CREATE TABLE IF NOT EXISTS web_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        secret_hash TEXT NOT NULL,
        csrf_token TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `)
    database.run(
      'CREATE INDEX IF NOT EXISTS web_sessions_user_id_idx ON web_sessions(user_id)',
    )
    database.run(
      'CREATE INDEX IF NOT EXISTS web_sessions_expires_at_idx ON web_sessions(expires_at)',
    )

    this.insert = database.query(`
      INSERT INTO web_sessions (
        id, user_id, secret_hash, csrf_token, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `)
    this.find = database.query<SessionRow, [string]>(`
      SELECT id, user_id, secret_hash, csrf_token, created_at, expires_at
      FROM web_sessions
      WHERE id = ?
    `)
    this.remove = database.query('DELETE FROM web_sessions WHERE id = ?')
    this.removeExpired = database.query(
      'DELETE FROM web_sessions WHERE expires_at <= ?',
    )
  }

  async create(record: SessionRecord): Promise<void> {
    this.insert.run(
      record.id,
      record.userId,
      record.secretHash,
      record.csrfToken,
      record.createdAt,
      record.expiresAt,
    )
  }

  async findById(id: string): Promise<SessionRecord | undefined> {
    const row = this.find.get(id) as SessionRow | null
    if (!row) return undefined

    return {
      id: row.id,
      userId: row.user_id,
      secretHash: row.secret_hash,
      csrfToken: row.csrf_token,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }
  }

  async delete(id: string): Promise<void> {
    this.remove.run(id)
  }

  async deleteExpired(now: number): Promise<void> {
    this.removeExpired.run(now)
  }
}
