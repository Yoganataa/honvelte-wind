import { SQL } from 'bun'
import { expect, test } from 'bun:test'
import { migratePostgres } from '../src/migrate'
import { createNotesRepository } from '../src/notes-repository'

const databaseUrl = process.env.DATABASE_URL_TEST

test.skipIf(!databaseUrl)(
  'PostgreSQL adapter applies migrations idempotently and persists notes',
  async () => {
    const url = new URL(databaseUrl!)
    const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ''))

    if (!databaseName.endsWith('_test')) {
      throw new Error(
        'DATABASE_URL_TEST must point to a disposable database ending in _test.',
      )
    }

    const database = new SQL(url.toString(), {
      max: 2,
      database: databaseName,
    })

    try {
      const [connection] = await database.unsafe(
        'SELECT current_database() AS database_name',
      )
      expect(connection?.database_name).toBe(databaseName)

      const firstRun = await migratePostgres(database)
      const secondRun = await migratePostgres(database)

      expect(firstRun.length).toBeLessThanOrEqual(1)
      expect(secondRun).toEqual([])

      const migrationRows = await database.unsafe(
        'SELECT migration_id FROM schema_migrations WHERE migration_id = $1',
        ['0001_create_notes.sql'],
      )
      expect(migrationRows).toHaveLength(1)

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
