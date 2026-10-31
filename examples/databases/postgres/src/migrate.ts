import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { SQL } from 'bun'

const MIGRATION_PATTERN = /^\d{4}_[a-z0-9_]+\.sql$/

export async function migratePostgres(
  database: SQL,
  migrationsDirectory = resolve(import.meta.dir, '../migrations'),
): Promise<string[]> {
  await database.unsafe(
    'CREATE TABLE IF NOT EXISTS schema_migrations (migration_id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)',
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

    const wasApplied = await database.begin(async (transaction) => {
      await transaction.unsafe(
        'SELECT pg_advisory_xact_lock(7318220461::bigint)',
      )

      const existing = await transaction.unsafe(
        'SELECT migration_id FROM schema_migrations WHERE migration_id = $1',
        [filename],
      )

      if (existing.length > 0) return false

      // Raw SQL is restricted to checked-in migration files, never user input.
      await transaction.unsafe(migrationSql).simple()
      await transaction.unsafe(
        'INSERT INTO schema_migrations (migration_id) VALUES ($1)',
        [filename],
      )

      return true
    })

    if (wasApplied) applied.push(filename)
  }

  return applied
}

if (import.meta.main) {
  const { createPostgresDatabase } = await import('./database')
  const database = createPostgresDatabase()

  try {
    const applied = await migratePostgres(database)
    console.info(
      applied.length > 0
        ? 'Applied PostgreSQL migrations: ' + applied.join(', ')
        : 'PostgreSQL schema is up to date.',
    )
  } finally {
    await database.close()
  }
}
