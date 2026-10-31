import { openSqliteDatabase } from './database'
import { migrateSqlite } from './migrate'
import { createNotesRepository } from './notes-repository'

const database = openSqliteDatabase()

try {
  await migrateSqlite(database)

  const notes = createNotesRepository(database)
  const created = notes.create(
    'Database adapter example',
    "This row was stored with Bun's built-in SQLite driver.",
  )

  console.info('Created SQLite note:', created)
} finally {
  database.close()
}
