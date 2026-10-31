# Optional database examples

These examples show two database choices without adding a database driver, ORM, migration tool, or service to the default Honvelte Wind workspace.

- sqlite/ uses Bun's built-in bun:sqlite driver and a local file.
- postgres/ uses Bun's built-in Bun.SQL PostgreSQL adapter and a PostgreSQL 18 server.

Each example owns its migrations, connection setup, repository, and tests. They are references to copy selectively into an application—not packages imported by apps/api.

## Why separate examples?

SQLite and PostgreSQL have different operational characteristics. SQLite is an embedded database suited to local and single-node workloads; PostgreSQL is a client-server database suited to concurrent multi-user and managed production deployments. The base starter should not choose for every application.

Both examples use checked-in, ordered SQL migrations and a schema_migrations table. SQL values are parameterized. Migration files are trusted source-controlled SQL; never build migration file names or SQL statements from user input.

See each example's README for setup, migration, and test instructions.
