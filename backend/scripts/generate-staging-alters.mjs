import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {tenantDDL,masterDDL,ensureSchema} from '../src/schema.js';
const destination=fileURLToPath(new URL('../../migrations/staging/',import.meta.url));
const literal=value=>"'"+value.replaceAll("'","''")+"'";
function parts(ddl){
 const body=ddl.slice(ddl.indexOf('(')+1,-1);let depth=0,quoted=false,start=0,result=[];
 for(let i=0;i<body.length;i++){
  if(body[i]==="'"){if(quoted&&body[i+1]==="'"){i++;continue}quoted=!quoted}
  if(!quoted){if(body[i]==='(')depth++;if(body[i]===')')depth--;if(body[i]===','&&depth===0){result.push(body.slice(start,i).trim());start=i+1}}
 }
 result.push(body.slice(start).trim());return result;
}
async function operations(ddl){
 const sql=[];
 // Upgrade each table before dependent CREATE statements reference it.
 for(const statement of ddl){
  sql.push(statement);
  const table=statement.match(/EXISTS (\w+)/)[1];
  for(const column of parts(statement)){
   if(/^(PRIMARY|UNIQUE|FOREIGN|CHECK|CONSTRAINT)\b/.test(column))continue;
   sql.push(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column}`);
  }
 }
 // Reuse the application's maintained index, trigger and view definitions.
 const extra=[];await ensureSchema({query:async statement=>extra.push(statement)},'staging_target_placeholder',ddl);
 const statements=extra.filter(statement=>!statement.startsWith('CREATE SCHEMA')&&!statement.startsWith('SET LOCAL')&&!statement.startsWith('CREATE TABLE'));
 return sql.map(statement=>`    EXECUTE ${literal(statement)};`).join('\n')+'\n'+statements.map(statement=>`    EXECUTE replace(${literal(statement)}, '"staging_target_placeholder"', quote_ident(target_schema));`).join('\n');
}
const header=`-- Generated from backend/src/schema.js. PostgreSQL only.
-- ADDITIVE upgrade: existing column types/defaults and constraints are not rewritten.
-- Existing populated tables with missing required columns without defaults cause a rollback.
-- Stop application writers and take a database backup before applying.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';
SELECT pg_advisory_xact_lock(742918);
`;
const footer='\nCOMMIT;\n';
const master=`${header}
DO $upgrade_master$
DECLARE target_schema text := 'knockout_master'; -- Change only if the master schema has a different name.
BEGIN
 IF to_regclass(format('%I.master_users',target_schema)) IS NULL OR to_regclass(format('%I.companies',target_schema)) IS NULL THEN
  RAISE EXCEPTION 'Expected existing master schema % with master_users and companies. No changes applied.',target_schema;
 END IF;
 PERFORM set_config('search_path',format('%I,pg_catalog',target_schema),true);
${await operations(masterDDL)}
 RAISE NOTICE 'Added missing master structures in %',target_schema;
END $upgrade_master$;
${footer}`;
const companies=`${header}
DO $upgrade_companies$
DECLARE
 master_schema text := 'knockout_master'; -- Must match the master script.
 target_schema text;
 registered_schema text;
 upgraded integer := 0;
BEGIN
 IF to_regclass(format('%I.companies',master_schema)) IS NULL THEN
  RAISE EXCEPTION 'Master company registry not found in schema %. Run the master script first.',master_schema;
 END IF;
 -- Never silently create an empty replacement for a missing tenant.
 FOR registered_schema IN EXECUTE format('SELECT database_name FROM %I.companies',master_schema) LOOP
  IF registered_schema IS NULL OR registered_schema !~ '^(knockout(_[0-9]+)?|tenant_[a-z][a-z0-9_]+)$' THEN
   RAISE EXCEPTION 'Unexpected registered company schema: %',registered_schema;
  END IF;
  IF to_regclass(format('%I.settings',registered_schema)) IS NULL OR to_regclass(format('%I.users',registered_schema)) IS NULL THEN
   RAISE EXCEPTION 'Company schema % is missing settings/users. Restore or inspect it before upgrading.',registered_schema;
  END IF;
 END LOOP;
 -- Includes registered schemas plus existing legacy/orphan company schemas.
 FOR target_schema IN SELECT nspname FROM pg_namespace WHERE nspname ~ '^(knockout(_[0-9]+)?|tenant_[a-z][a-z0-9_]+)$' ORDER BY nspname LOOP
  IF to_regclass(format('%I.settings',target_schema)) IS NULL OR to_regclass(format('%I.users',target_schema)) IS NULL THEN
   RAISE EXCEPTION 'Schema % does not have the expected company base tables.',target_schema;
  END IF;
  PERFORM set_config('search_path',format('%I,pg_catalog',target_schema),true);
${await operations(tenantDDL)}
  upgraded := upgraded + 1;
  RAISE NOTICE 'Added missing company structures in %',target_schema;
 END LOOP;
 IF upgraded=0 THEN RAISE EXCEPTION 'No company schemas found. Verify the database connection.'; END IF;
END $upgrade_companies$;
${footer}`;
await mkdir(destination,{recursive:true});
await writeFile(destination+'01-master-add-missing.sql',master);
await writeFile(destination+'02-companies-add-missing.sql',companies);
console.log('Generated additive master/company SQL; no database connections were made.');
