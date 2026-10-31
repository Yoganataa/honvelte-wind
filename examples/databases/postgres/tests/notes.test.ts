import { SQL } from 'bun'
import { expect, test } from 'bun:test'
import { migratePostgres } from '../src/migrate'
import { createNotesRepository } from '../src/notes-repository'

const databaseUrl = process.env.DATABASE_URL_TEST

test.skipIf(!databaseUrl)(
  'PostgreSQL adapter applies migrations idempotently and persists notes',
  async () => {
    const url = new URL(databaseUrl!)
    const databaseName = url.pathname.replace(/^\/+/, '')

    if (!databaseName.endsWith('_test')) {
      throw new Error(
        'DATABASE_URL_TEST must point to a disposable database ending in _test.',
      )
    }

    const database = new SQL(url.toString(), { max: 2 })

    try {
      const firstRun = await migratePostgres(database)
      const secondRun = await migratePostgres(database)

      expect(firstRun).toEqual(['0001_create_notes.sql'])
      expect(secondRun).toEqual([])

      const repository = createNotesRepository(database)
      const title = 'Integration note ' + crypto.randomUUID()
      const created = await repository.create(
        title,
        'Bound parameters keep SQL-looking content as data: DROP TABLE notes;',
      )
      const notes = await repository.list(100)

      expect(created.title).toBe(title)
      expect(created.content).toContain('DROP TABLE notes;')
      expect(notes).toContainEqual(created)
    } finally {
      await database.close()
    }
  },
)
