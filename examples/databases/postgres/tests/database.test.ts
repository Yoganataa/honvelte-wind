import { expect, test } from 'bun:test'
import { createPostgresDatabase } from '../src/database'

test('requires a PostgreSQL connection URL', () => {
  expect(() => createPostgresDatabase('')).toThrow('DATABASE_URL is required')
})

test('rejects non-PostgreSQL connection URLs', () => {
  expect(() =>
    createPostgresDatabase('mysql://user:password@localhost:3306/app'),
  ).toThrow('DATABASE_URL must use postgres:// or postgresql://')
})

test('requires verified TLS for production connections', () => {
  const previousNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'

  try {
    expect(() =>
      createPostgresDatabase('postgres://user:password@db.example.com/app'),
    ).toThrow('require sslmode=verify-full')

    const database = createPostgresDatabase(
      'postgres://user:password@db.example.com/app?sslmode=verify-full',
    )
    return database.close()
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = previousNodeEnv
    }
  }
})
