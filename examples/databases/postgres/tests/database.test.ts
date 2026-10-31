import { expect, test } from 'bun:test'
import {
  assertProductionPostgresTls,
  createPostgresDatabase,
} from '../src/database'

test('requires a PostgreSQL connection URL', () => {
  expect(() => createPostgresDatabase('')).toThrow('DATABASE_URL is required')
})

test('rejects non-PostgreSQL connection URLs', () => {
  expect(() =>
    createPostgresDatabase('mysql://user:password@localhost:3306/app'),
  ).toThrow('DATABASE_URL must use postgres:// or postgresql://')
})

test('requires verified TLS and rejects the global TLS bypass', () => {
  const urlWithoutSsl = new URL(
    'postgres://user:password@db.example.com/app',
  )
  const urlWithVerifiedSsl = new URL(
    'postgres://user:password@db.example.com/app?sslmode=verify-full',
  )

  expect(() =>
    assertProductionPostgresTls(urlWithoutSsl, undefined, undefined),
  ).toThrow('require sslmode=verify-full')

  expect(() =>
    assertProductionPostgresTls(urlWithVerifiedSsl, '0', undefined),
  ).toThrow('must not disable TLS certificate verification')

  expect(() =>
    assertProductionPostgresTls(urlWithoutSsl, undefined, 'verify-full'),
  ).not.toThrow()
})
