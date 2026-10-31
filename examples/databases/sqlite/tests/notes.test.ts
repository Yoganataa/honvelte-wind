import { Database } from 'bun:sqlite'
import { afterEach, describe, expect, test } from 'bun:test'
import { migrateSqlite } from '../src/migrate'
import { createNotesRepository } from '../src/notes-repository'

const databases: Database[] = []

function createTestDatabase() {
  const database = new Database(':memory:')
  databases.push(database)
  return database
}

afterEach(() => {
  for (const database of databases.splice(0)) {
    database.close()
  }
})

describe('SQLite database example', () => {
  test('applies migrations once and keeps the schema versioned', async () => {
    const database = createTestDatabase()

    const firstRun = await migrateSqlite(database)
    const secondRun = await migrateSqlite(database)

    expect(firstRun).toEqual(['0001_create_notes.sql'])
    expect(secondRun).toEqual([])

    const migrations = database
      .query<{ migration_id: string }, []>(
        'SELECT migration_id FROM schema_migrations ORDER BY migration_id',
      )
      .all()

    expect(migrations).toEqual([
      { migration_id: '0001_create_notes.sql' },
    ])
  })

  test('stores and reads notes using bound parameters', async () => {
    const database = createTestDatabase()
    await migrateSqlite(database)

    const repository = createNotesRepository(database)
    const title = "O'Reilly's test note"
    const created = repository.create(
      title,
      'Content with SQL-looking text: DROP TABLE notes;',
    )
    const notes = repository.list()

    expect(created.title).toBe(title)
    expect(created.content).toContain('DROP TABLE notes;')
    expect(notes).toContainEqual(created)
    expect(
      database
        .query<{ count: number }, []>('SELECT COUNT(*) AS count FROM notes')
        .get()?.count,
    ).toBe(1)
  })

  test('rejects blank titles through the database constraint', async () => {
    const database = createTestDatabase()
    await migrateSqlite(database)

    const repository = createNotesRepository(database)

    expect(() => repository.create('   ')).toThrow()
    expect(
      database
        .query<{ count: number }, []>('SELECT COUNT(*) AS count FROM notes')
        .get()?.count,
    ).toBe(0)
  })
})
