import { createPostgresDatabase } from './database'
import { migratePostgres } from './migrate'
import { createNotesRepository } from './notes-repository'

const database = createPostgresDatabase()

try {
  await migratePostgres(database)

  const notes = createNotesRepository(database)
  const created = await notes.create(
    'Database adapter example',
    "This row was stored with Bun's built-in PostgreSQL adapter.",
  )

  console.info('Created PostgreSQL note:', created)
} finally {
  await database.close()
}
