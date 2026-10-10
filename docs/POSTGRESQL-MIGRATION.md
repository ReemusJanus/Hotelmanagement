# PostgreSQL migration

The backend now uses PostgreSQL 17 through `pg`. `PGDATABASE` names the physical database (default `knockout`). The master namespace is `knockout_master`; each former tenant database becomes a schema with the same name. Existing API fields named `databaseName` and `companyDatabase` still identify the tenant schema.

Tenant connections select a validated schema in their search path. This is logical separation under a shared application credential, not PostgreSQL role-based isolation between tenants. Dates, camelCase response fields, booleans, and numeric IDs retain the API contract. Startup creates missing tables without resetting existing business values. Demo data is opt-in with `SEED_DEMO_DATA=true`.

## Existing data cutover

1. Stop application writers, scheduled jobs and administrative changes to MariaDB. Take and verify a full backup, including every tenant and the master database. Keep the old application release and environment for rollback. Do not delete the MariaDB volume.
2. Install dependencies with `npm ci`. The MariaDB driver is a development dependency used only by the importer; production APIs use `pg`.
3. Configure `.env`: `DB_HOST=postgres`, `DB_PORT=5432`, `PGDATABASE=knockout`, `DB_USER` and `DB_PASSWORD`. For host-run Node processes use `DB_HOST=127.0.0.1` and the published port. Keep `SEED_DEMO_DATA=false`. Set `DB_TIMEZONE` to the timezone in which source timestamps were stored (default `Asia/Kolkata`).
4. Start **only** PostgreSQL: `docker compose up -d postgres`. Do not start APIs before importing: they create schemas, while the importer deliberately refuses existing target schemas.
5. In a shell with the target connection variables exported, export `SOURCE_DB_HOST`, `SOURCE_DB_PORT`, `SOURCE_DB_USER`, `SOURCE_DB_PASSWORD`, and optionally `SOURCE_MASTER_DB_NAME`. The source account needs read access to all tenant databases and the master database. Point target `DB_HOST` at `127.0.0.1` when running the importer on the host.
6. Run `npm run migrate:mariadb --workspace backend -- --confirm-source-readonly`. The flag confirms source application writes have stopped; the importer never writes MariaDB. A SQL dump must first be restored into an isolated MariaDB server; this command does not parse SQL dumps.
7. Review the per-table verification report. The importer uses a consistent source snapshot and one target transaction, checks row counts and normalized content hashes, restores identity sequences, and rolls back on failure. Unknown/missing tables or columns fail instead of silently dropping data. Legacy `pay_type=hourly` is normalized to `daily`, matching the previous application's upgrade behavior. A schema mismatch requires inspection, not bypassing verification.
8. Start the remaining services with `docker compose up -d --build`. Verify master login, every tenant login, orders, billing, booking overlap, inventory and reports. Frontend remains on port **5200**. Existing users may need to sign in again if the session signing configuration changes.

For a genuinely empty installation, skip the import only when no old data is needed. Set a private six-digit `MASTER_BOOTSTRAP_PIN` before first master startup; no default administrator PIN is created. Remove that variable after bootstrap. Object storage must also be available; an image pull/storage failure is independent of PostgreSQL.

## Rollback

Before accepting new writes in PostgreSQL, revert to the saved MariaDB application release and environment and restart against the retained MariaDB volume. The updated Compose file keeps MariaDB/phpMyAdmin under `--profile legacy`; this profile alone does not make the new PostgreSQL code compatible with MariaDB. After new PostgreSQL writes, reconcile/export those writes before reverting; there is no automatic reverse replication. Never use `docker compose down -v` during migration.

## Validation

`npm test --workspace backend` runs the binding test and skips database tests unless explicitly enabled. Against a disposable PostgreSQL server, export its `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and set `PG_INTEGRATION=1`. Run the same command. Tests create/drop temporary schemas and databases; the test role needs database-creation privileges. API tests run all five services with real PostgreSQL and a storage stub; they do not validate object storage or the production deployment.

The optional importer test additionally needs a **fresh disposable** MariaDB on localhost:53306 with root password `local-migration-test`, and `MARIADB_IMPORT_TEST=1`. It creates fixture databases named `knockout`/`knockout_master`; never point it at a real application server. It validates content/sequence preservation and rejection of an overwrite.

References: [PostgreSQL schemas](https://www.postgresql.org/docs/current/ddl-schemas.html), [node-postgres parameterized queries](https://node-postgres.com/features/queries).
