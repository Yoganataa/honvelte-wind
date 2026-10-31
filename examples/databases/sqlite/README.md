# SQLite adapter example

Uses Bun's built-in bun:sqlite driver. No package install is required.

## Run

From the repository root:

    bun run examples/databases/sqlite/src/migrate.ts
    bun run examples/databases/sqlite/src/demo.ts

The default database file is examples/databases/sqlite/data/app.sqlite. Override it with SQLITE_DATABASE_PATH.

    SQLITE_DATABASE_PATH=./data/local.sqlite bun run examples/databases/sqlite/src/migrate.ts

The example enables foreign keys and a busy timeout. File-backed databases use WAL mode; in-memory databases do not.

## Use from an application

- Call openSqliteDatabase() once during application startup.
- Run migrateSqlite(database) before accepting requests.
- Construct createNotesRepository(database) and inject it into the feature that owns note operations.
- Close the database during graceful shutdown.

The repository is synchronous because Bun's bun:sqlite API is synchronous. Keep database calls short; do not perform network or other asynchronous work inside a SQLite transaction callback.

## Migrations

Add a new file using the next ordered prefix, for example 0002_add_note_status.sql. Applied migration file names are stored in schema_migrations. Do not edit a migration after it has been applied to a shared database; add a new migration instead.

## Tests

    bun test examples/databases/sqlite

Tests use isolated in-memory databases and do not touch the local data file.
