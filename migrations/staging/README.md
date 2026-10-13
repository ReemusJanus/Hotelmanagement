# Staging PostgreSQL additive upgrades

The consolidation into one backend process requires no database schema change. These scripts are for staging installations that are missing structures already declared in `backend/src/schema.js`.

**These are PostgreSQL-only scripts for one physical database containing master and company schemas.** They are not a database-engine conversion and do not support separate physical master/company databases. The expected master schema is `knockout_master`; companies use `knockout`, `knockout_<digits>` or `tenant_*`. Change `master_schema`/`target_schema` in both scripts if your master schema has another name. Other company naming conventions require adaptation.

The deployed staging schema has not yet been inspected. Run `00-inspect.sql` first and compare its output to the application schema before applying upgrades. If existing columns have incompatible types, defaults or constraints, these scripts do not reconcile them. Share a schema-only export for a precise migration.

## Run

Use the usual PostgreSQL connection settings (`PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`) and a password prompt or protected `.pgpass` file. Connect to staging, not production. Use a schema owner with permission to alter every intended schema. Stop staging application writers and take a backup before applying.

```sh
psql -X -v ON_ERROR_STOP=1 -f migrations/staging/00-inspect.sql
psql -X -v ON_ERROR_STOP=1 -f migrations/staging/01-master-add-missing.sql
psql -X -v ON_ERROR_STOP=1 -f migrations/staging/02-companies-add-missing.sql
```

Each upgrade file is its own transaction. A failure rolls back that file; a successful master upgrade remains committed if the later company upgrade fails. The company file upgrades all matching company schemas in one transaction, including suspended and orphan schemas. It verifies that registered company schemas exist rather than creating empty replacements. Unknown registered schema names and missing base tables abort execution. Locks time out after five seconds; statements time out after two minutes. Rerun only after resolving the cause of an error.

## Scope

- Create missing tables and add missing columns using current project definitions.
- Add application indexes if absent; refresh the application's timestamp triggers and master registration views.
- Preserve existing table rows, IDs, sequences and credentials. Existing values are not reset.
- Existing column definitions and table constraints are not rewritten. Constraints on new tables/new columns come from their declarations; missing constraints on existing columns/tables are not repaired. Existing same-named indexes are not replaced.
- Newly added columns receive their declared default or NULL. A missing required column without a default on a populated table fails rather than inventing business values.
- No master PIN, module pricing, company record or demo data is seeded by these files. Normal backend initialization remains responsible for its bootstrap behavior.

The scripts can be rerun; columns/tables/indexes already present are skipped. Stop on any error and inspect the transaction result. After a successful upgrade, restart the backend and test master login, a company login, a bill and an order workflow. No staging database was modified while preparing these files.

Regenerate with `node backend/scripts/generate-staging-alters.mjs` after reviewing schema changes.
