# PostgreSQL setup

The backend uses PostgreSQL 17 and the `pg` driver. All services use one physical database, selected by `PGDATABASE` (default `knockout`). `knockout_master` holds the company catalog; `knockout` and `tenant_*` schemas hold company data. Tenant schemas share the application's database role. API fields named `databaseName` remain tenant schema identifiers.

## Configuration and startup

Set these values in the private `.env` file:

- `DB_HOST=postgres`, `DB_PORT=5432` for Docker services.
- `PGDATABASE=knockout`, `DB_USER=knockout`, and a private `DB_PASSWORD`.
- `PG_EXTERNAL_PORT=5432` for localhost access.
- `MASTER_BOOTSTRAP_PIN`: a private six-digit PIN for the first master account. Remove after bootstrap; existing accounts are preserved.
- `SEED_DEMO_DATA=false`; set true only when demo data is wanted.
- `DB_TIMEZONE=Asia/Kolkata`; use the timezone appropriate to stored timestamps.
- `PGSSL=false` for the local container; enable verified TLS when connecting to a TLS-configured external server.

Run `docker compose up -d --build`. The frontend stays at http://localhost:5200. For Node processes outside Docker, override `DB_HOST=127.0.0.1` and `DB_PORT` to the published port. Database initialization creates the current schema automatically. `knockout-production.sql` provides the same structure without records. Do not apply it to another database engine.

PostgreSQL data persists in `knockout_postgres`; storage and Redis retain their own volumes. Stop with `docker compose down` to retain data. The repository contains no alternate database service or import tool. Removing old service definitions does not delete any external database data. Existing business records have not been transferred by this cleanup.

## Backup and restore

Back up the physical database so the catalog and all tenant schemas stay together. Protect backup files as sensitive data. From the project directory:

```sh
mkdir -p backups
chmod 700 backups
umask 077
docker compose exec -T postgres sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/knockout.dump
```

Rehearse restores into a separate empty recovery database with APIs stopped. In the isolated recovery Compose project:

```sh
docker compose exec -T postgres sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore --exit-on-error --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backups/knockout.dump
```

Back up object storage separately; SQL backups contain object references, not image/report bytes. Logical backups do not configure continuous WAL archiving or automatic failover.

## Verification

`npm test --workspace backend` runs the unit test. Integration tests require a disposable PostgreSQL server and exported `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, with `PG_INTEGRATION=1`. The test role must be able to create temporary databases. Tests cover schema constraints, identity sequences, tenant isolation, transactions and API workflows. API tests stub object storage; they do not validate a production storage deployment.
