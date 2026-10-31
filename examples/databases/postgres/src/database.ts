import { SQL } from 'bun'

function parsePoolMax(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return 10

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
    throw new Error('PG_POOL_MAX must be an integer between 1 and 50.')
  }

  return parsed
}

export function createPostgresDatabase(
  connectionString = process.env.DATABASE_URL,
): SQL {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to connect to PostgreSQL.')
  }

  let url: URL
  try {
    url = new URL(connectionString)
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.')
  }

  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use postgres:// or postgresql://.')
  }

  return new SQL(url.toString(), {
    max: parsePoolMax(process.env.PG_POOL_MAX),
    connectionTimeout: 10,
    idleTimeout: 30,
    maxLifetime: 1800,
  })
}
