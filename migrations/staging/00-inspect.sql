-- Read-only staging inventory. Does not include business records or credentials.
SELECT current_database() AS database_name, version() AS engine;
SELECT table_schema,table_name,column_name,data_type,udt_name,character_maximum_length,numeric_precision,numeric_scale,is_nullable,column_default,is_identity
FROM information_schema.columns
WHERE table_schema='knockout_master' OR table_schema ~ '^(knockout(_[0-9]+)?|tenant_[a-z][a-z0-9_]+)$'
ORDER BY table_schema,table_name,ordinal_position;
SELECT n.nspname AS schema_name,t.relname AS table_name,c.conname AS constraint_name,pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace
WHERE n.nspname='knockout_master' OR n.nspname ~ '^(knockout(_[0-9]+)?|tenant_[a-z][a-z0-9_]+)$'
ORDER BY 1,2,3;
SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes
WHERE schemaname='knockout_master' OR schemaname ~ '^(knockout(_[0-9]+)?|tenant_[a-z][a-z0-9_]+)$'
ORDER BY 1,2,3;
