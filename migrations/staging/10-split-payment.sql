-- Split payment (part Cash, part Card / UPI) on orders, for every tenant schema. Additive and idempotent; normal backend startup runs the same step.
-- Existing orders keep NULL, so their single payment method and totals are unchanged.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $$ DECLARE s TEXT; BEGIN
  FOR s IN SELECT DISTINCT table_schema FROM information_schema.tables WHERE table_name='orders' AND table_schema NOT IN ('pg_catalog','information_schema','knockout_master') LOOP
    EXECUTE format('ALTER TABLE %I.orders ADD COLUMN IF NOT EXISTS payment_split JSONB NULL', s);
  END LOOP;
END $$;
COMMIT;
