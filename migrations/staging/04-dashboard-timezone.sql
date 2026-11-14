-- Optional per-tenant IANA timezone. NULL/empty uses the existing DB_TIMEZONE.
-- No financial records are modified. Apply before deploying the new backend.
BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT pg_advisory_xact_lock(742918);
DO $$
DECLARE tenant text;
BEGIN
 FOR tenant IN SELECT database_name FROM knockout_master.companies UNION SELECT 'knockout' LOOP
  EXECUTE format('ALTER TABLE %I.settings ADD COLUMN IF NOT EXISTS timezone TEXT',tenant);
 END LOOP;
END $$;
COMMIT;
