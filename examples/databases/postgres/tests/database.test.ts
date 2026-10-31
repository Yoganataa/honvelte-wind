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
  const previousTlsOverride = process.env.NODE_TLS_REJECT_UNAUTHORIZED
  process.env.NODE_ENV = 'production'

  try {
    expect(() =>
      createPostgresDatabase('postgres://user:password@db.example.com/app'),
    ).toThrow('require sslmode=verify-full')

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    expect(() =>
      createPostgresDatabase(
        'postgres://user:password@db.example.com/app?sslmode=verify-full',
      ),
    ).toThrow('must not disable TLS certificate verification')

    if (previousTlsOverride === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsOverride
    }

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

    if (previousTlsOverride === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsOverride
    }
  }
})
