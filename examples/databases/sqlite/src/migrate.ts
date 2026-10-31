import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Database } from 'bun:sqlite'

const MIGRATION_PATTERN = /^\d{4}_[a-z0-9_]+\.sql$/

export async function migrateSqlite(
  database: Database,
  migrationsDirectory = resolve(import.meta.dir, '../migrations'),
): Promise<string[]> {
  database.run(
    'CREATE TABLE IF NOT EXISTS schema_migrations (migration_id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  )

  const files = (await readdir(migrationsDirectory))
    .filter((filename) => MIGRATION_PATTERN.test(filename))
    .sort()

  const applied: string[] = []

  for (const filename of files) {
    const migrationSql = await readFile(
      join(migrationsDirectory, filename),
      'utf8',
    )

    const applyMigration = database.transaction(() => {
      const existing = database
        .query(
          'SELECT migration_id FROM schema_migrations WHERE migration_id = ?',
        )
        .get(filename)

      if (existing) return false

      // Migration SQL is loaded from this repository's trusted migrations directory.
      database.run(migrationSql)
      database
        .query('INSERT INTO schema_migrations (migration_id) VALUES (?)')
        .run(filename)

      return true
    })

    if (applyMigration.immediate()) {
      applied.push(filename)
    }
  }

  return applied
}

if (import.meta.main) {
  const { openSqliteDatabase } = await import('./database')
  const database = openSqliteDatabase()

  try {
    const applied = await migrateSqlite(database)
    console.info(
      applied.length > 0
        ? 'Applied SQLite migrations: ' + applied.join(', ')
        : 'SQLite schema is up to date.',
    )
  } finally {
    database.close()
  }
}
