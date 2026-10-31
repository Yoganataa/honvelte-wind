import type { Database } from 'bun:sqlite'

export type Note = {
  id: string
  title: string
  content: string
  createdAt: string
}

type NoteRow = {
  id: number | bigint
  title: string
  content: string
  created_at: string
}

function toNote(row: NoteRow): Note {
  return {
    id: String(row.id),
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
  }
}

export function createNotesRepository(database: Database) {
  const insert = database.query(
    'INSERT INTO notes (title, content) VALUES (?, ?)',
  )
  const findById = database.query<NoteRow, [number | bigint]>(
    'SELECT id, title, content, created_at FROM notes WHERE id = ?',
  )
  const listNotes = database.query<NoteRow, []>(
    'SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC, id DESC',
  )

  return {
    create(title: string, content = ''): Note {
      const result = insert.run(title, content)
      const row = findById.get(result.lastInsertRowid)

      if (!row) {
        throw new Error('SQLite did not return the inserted note.')
      }

      return toNote(row)
    },

    list(): Note[] {
      return listNotes.all().map(toNote)
    },
  }
}
