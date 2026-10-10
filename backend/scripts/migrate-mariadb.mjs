/** Offline, all-or-nothing MariaDB -> PostgreSQL import. No source writes. */
import mysql from 'mysql2/promise';
import crypto from 'node:crypto';
import {createPool,quoteIdentifier} from '../src/postgres.js';
import {ensureSchema,tenantDDL,masterDDL,syncSequences} from '../src/schema.js';

if(!process.argv.includes('--confirm-source-readonly'))throw new Error('Stop source application writes, back up MariaDB, then pass --confirm-source-readonly.');
for(const key of ['SOURCE_DB_HOST','SOURCE_DB_USER','SOURCE_DB_PASSWORD','DB_PASSWORD'])if(!process.env[key])throw new Error(`${key} is required`);
const master=process.env.MASTER_DB_NAME||'knockout_master';quoteIdentifier(master);
const sourceMaster=process.env.SOURCE_MASTER_DB_NAME||master;quoteIdentifier(sourceMaster);
const source=await mysql.createConnection({host:process.env.SOURCE_DB_HOST,port:Number(process.env.SOURCE_DB_PORT||3306),user:process.env.SOURCE_DB_USER,password:process.env.SOURCE_DB_PASSWORD,dateStrings:true,supportBigNumbers:true,bigNumberStrings:true});
const target=createPool(),connection=await target.getConnection();
const report=[];
const tablesFor=ddl=>ddl.map(sql=>sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1]);
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
function normalized(value,type){
 if(value===null)return null;
 if(type==='boolean')return Boolean(Number(value)||value===true);
 if(['numeric','integer','bigint','smallint','double precision','real'].includes(type))return String(Number(value));
 if(type==='jsonb')return stable(typeof value==='string'?JSON.parse(value):value);
 if(type.startsWith('timestamp'))return String(value).replace('T',' ').replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1');
 return value;
}
try{
 await source.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
 await source.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
 const[registered]=await source.query(`SELECT database_name FROM \`${sourceMaster}\`.companies`);
 const[discovered]=await source.query("SELECT SCHEMA_NAME name FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='knockout' OR SCHEMA_NAME REGEXP '^knockout_[0-9]+$' OR SCHEMA_NAME REGEXP '^tenant_[a-z][a-z0-9_]+$'");
 const tenants=[...new Set(['knockout',...registered.map(row=>row.database_name),...discovered.map(row=>row.name)])];
 tenants.forEach(name=>{quoteIdentifier(name);if(!/^(knockout(_[0-9]+)?|tenant_[a-z][a-z0-9_]+)$/.test(name))throw new Error('Unrecognized tenant schema name')});
 await connection.beginTransaction();
 await connection.query('SELECT pg_advisory_xact_lock(742918)');
 for(const [sourceName,targetName,ddl] of [[sourceMaster,master,masterDDL],...tenants.map(name=>[name,name,tenantDDL])]){
   const[[existing]]=await connection.query('SELECT schema_name FROM information_schema.schemata WHERE schema_name=?',[targetName]);
   if(existing)throw new Error(`Target schema ${targetName} already exists. Import only into a fresh PostgreSQL database; nothing will be overwritten.`);
   const[sourceTables]=await source.query("SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'",[sourceName]);
   const expected=tablesFor(ddl),actual=sourceTables.map(row=>row.name);
   if(expected.some(name=>!actual.includes(name))||actual.some(name=>!expected.includes(name)))throw new Error(`Source schema ${sourceName} differs from the supported application schema; inspect it before importing.`);
   await ensureSchema(connection,targetName,ddl);
   for(const table of expected){
     const[columns]=await connection.query('SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=? AND table_name=? ORDER BY ordinal_position',[targetName,table]);
     const[sourceColumns]=await source.query('SELECT COLUMN_NAME name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY ORDINAL_POSITION',[sourceName,table]);
     const names=sourceColumns.map(row=>row.name);
     if(names.some(name=>!columns.some(column=>column.column_name===name)))throw new Error(`Unsupported source column in ${sourceName}.${table}`);
     const used=columns.filter(column=>names.includes(column.column_name));
     const order=names.includes('id')?'id':'module_key';quoteIdentifier(order);
     const sourceHash=crypto.createHash('sha256');let count=0;
     for(let offset=0;;offset+=500){
       const[rows]=await source.query(`SELECT * FROM \`${sourceName}\`.\`${table}\` ORDER BY \`${order}\` LIMIT 500 OFFSET ?`,[offset]);
       if(!rows.length)break;
       for(const row of rows){
         const values=used.map(column=>{
           const value=row[column.column_name];
           if(column.data_type==='boolean'&&value!==null)return Boolean(Number(value));
           if(column.data_type==='jsonb'&&value!==null)return typeof value==='string'?value:JSON.stringify(value);
           if(column.column_name==='pay_type'&&value==='hourly')return 'daily';
           return value;
         });
         await connection.query(`INSERT INTO ${quoteIdentifier(targetName)}.${quoteIdentifier(table)} (${used.map(column=>quoteIdentifier(column.column_name)).join(',')}) VALUES (${used.map(()=>'?').join(',')})`,values);
         sourceHash.update(JSON.stringify(values.map((value,i)=>normalized(value,used[i].data_type)))+'\n');count++;
       }
     }
     const destinationHash=crypto.createHash('sha256');let checked=0;
     const projections=used.map(column=>column.data_type.startsWith('timestamp')?`to_char(${quoteIdentifier(column.column_name)} AT TIME ZONE current_setting('TimeZone'),'YYYY-MM-DD HH24:MI:SS.US') AS ${quoteIdentifier(column.column_name)}`:quoteIdentifier(column.column_name));
     for(let offset=0;;offset+=500){
       const[rows]=await connection.query(`SELECT ${projections.join(',')} FROM ${quoteIdentifier(targetName)}.${quoteIdentifier(table)} ORDER BY ${quoteIdentifier(order)} LIMIT 500 OFFSET ?`,[offset]);
       if(!rows.length)break;
       for(const row of rows){destinationHash.update(JSON.stringify(used.map(column=>normalized(row[column.column_name],column.data_type)))+'\n');checked++}
     }
     if(count!==checked||sourceHash.digest('hex')!==destinationHash.digest('hex'))throw new Error(`Verification failed for ${sourceName}.${table}; target transaction rolled back.`);
     report.push({schema:targetName,table,rows:count,verified:true});
   }
   await syncSequences(connection,targetName,ddl);
 }
 await connection.commit();
 console.log(JSON.stringify({imported:true,tables:report},null,2));
}catch(error){await connection.rollback();throw error}
finally{await source.rollback();await source.end();connection.release();await target.end()}
