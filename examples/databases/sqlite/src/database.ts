import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Database } from 'bun:sqlite'

export function openSqliteDatabase(
  filename =
    process.env.SQLITE_DATABASE_PATH ??
    resolve(import.meta.dir, '../data/app.sqlite'),
): Database {
  if (filename !== ':memory:') {
    mkdirSync(dirname(resolve(filename)), { recursive: true })
  }

  const database = new Database(filename, {
    create: true,
    strict: true,
  })

  database.run('PRAGMA foreign_keys = ON')
  database.run('PRAGMA busy_timeout = 5000')

  if (filename !== ':memory:') {
    database.run('PRAGMA journal_mode = WAL')
  }

  return database
}
