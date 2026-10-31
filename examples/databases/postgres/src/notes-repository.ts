import type { SQL } from 'bun'

export type Note = {
  id: string
  title: string
  content: string
  createdAt: string
}

type NoteRow = {
  id: string | bigint | number
  title: string
  content: string
  created_at: string | Date
}

function toNote(row: NoteRow): Note {
  return {
    id: String(row.id),
    title: row.title,
    content: row.content,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export function createNotesRepository(database: SQL) {
  return {
    async create(title: string, content = ''): Promise<Note> {
      const rows = await database.unsafe(
        'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at',
        [title, content],
      )
      const row = rows[0] as NoteRow | undefined

      if (!row) {
        throw new Error('PostgreSQL did not return the inserted note.')
      }

      return toNote(row)
    },

    async list(limit = 50): Promise<Note[]> {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new RangeError('Note list limit must be an integer between 1 and 100.')
      }

      const rows = await database.unsafe(
        'SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC, id DESC LIMIT $1',
        [limit],
      )

      return (rows as NoteRow[]).map(toNote)
    },
  }
}
