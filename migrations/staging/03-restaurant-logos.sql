-- Additive, idempotent tenant settings migration. No master-table changes required.
-- Back up the database before applying; run against the shared physical database.
BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT pg_advisory_xact_lock(742918);
DO $$
DECLARE tenant text;
BEGIN
 FOR tenant IN SELECT database_name FROM knockout_master.companies UNION SELECT 'knockout' LOOP
  IF to_regclass(format('%I.settings',tenant)) IS NULL THEN
   RAISE EXCEPTION 'Missing settings for registered tenant %',tenant;
  END IF;
  EXECUTE format('ALTER TABLE %I.settings ADD COLUMN IF NOT EXISTS logo_url TEXT, ADD COLUMN IF NOT EXISTS logo_storage_key TEXT, ADD COLUMN IF NOT EXISTS show_logo_on_bill BOOLEAN NOT NULL DEFAULT TRUE, ADD COLUMN IF NOT EXISTS show_logo_watermark BOOLEAN NOT NULL DEFAULT FALSE',tenant);
 END LOOP;
END $$;
COMMIT;
