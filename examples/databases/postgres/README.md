# PostgreSQL adapter example

Uses Bun's built-in Bun.SQL PostgreSQL adapter. No package install is required. The CI integration test uses PostgreSQL 18.6.

## Configure

Copy .env.example to a local, untracked environment file or export the variables in your shell. Use a dedicated application database and a separate disposable test database.

DATABASE_URL must point to the application database. DATABASE_URL_TEST is used only by the integration test and is intentionally required to end in _test as a guard against accidentally running the test against an ordinary database.

## Run

From the repository root:

    bun run examples/databases/postgres/src/migrate.ts
    bun run examples/databases/postgres/src/demo.ts

Set DATABASE_URL before running either command. The example uses a bounded connection pool and a transaction-scoped advisory lock for serialized migrations.

For remote production databases, use TLS with certificate and hostname validation, for example by adding sslmode=verify-full to DATABASE_URL. Bun supports PostgreSQL SSL modes; do not disable certificate verification to work around an invalid certificate.

## Use from an application

- Create one SQL client during application startup with createPostgresDatabase().
- Run migratePostgres(database) before accepting requests.
- Construct createNotesRepository(database) and inject it into the feature that owns note operations.
- Close the pool during graceful shutdown.

Repository operations are asynchronous. All values are passed through Bun.SQL tagged templates, not interpolated into raw SQL.

## Migrations

Add a new file using the next ordered prefix, for example 0002_add_note_status.sql. Applied migration file names are stored in schema_migrations. Migrations run in transactions; do not edit a migration after it has been applied to a shared database.

## Tests

The test requires DATABASE_URL_TEST to point to a disposable database whose name ends in _test. It does not drop the database or schema, and it never reads DATABASE_URL.

    bun test examples/databases/postgres

If DATABASE_URL_TEST is not set, the integration test is skipped. CI runs it against a fresh PostgreSQL service.
