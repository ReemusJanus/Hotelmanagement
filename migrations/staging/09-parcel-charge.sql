-- Parcel charge on orders, for every tenant schema. Additive and idempotent; normal backend startup runs the same step.
-- Existing orders get 0, so historical totals and dine-in bills are unchanged.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $$ DECLARE s TEXT; BEGIN
  FOR s IN SELECT DISTINCT table_schema FROM information_schema.tables WHERE table_name='orders' AND table_schema NOT IN ('pg_catalog','information_schema','knockout_master') LOOP
    EXECUTE format('ALTER TABLE %I.orders ADD COLUMN IF NOT EXISTS parcel_charge DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (parcel_charge >= 0)', s);
  END LOOP;
END $$;
COMMIT;
