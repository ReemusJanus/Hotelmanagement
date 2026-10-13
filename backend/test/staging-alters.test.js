import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {ensureSchema,masterDDL,tenantDDL} from '../src/schema.js';

test('staging ALTER scripts preserve records, cover all tenants, rerun and roll back unsafe additions',{skip:!process.env.PG_ALTER_TEST,timeout:30000},async()=>{
 const config={host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD};
 const control=new pg.Client({...config,database:'knockout'});await control.connect();
 const database=`knockout_alter_test_${process.pid}`;await control.query(`CREATE DATABASE "${database}"`);
 const client=new pg.Client({...config,database});await client.connect();
 const master=await readFile(new URL('../../migrations/staging/01-master-add-missing.sql',import.meta.url),'utf8');
 const companies=await readFile(new URL('../../migrations/staging/02-companies-add-missing.sql',import.meta.url),'utf8');
 const tenants=['knockout','knockout_2','tenant_alpha'];
 try{
  await client.query('BEGIN');
  await ensureSchema({query:sql=>client.query(sql)},'knockout_master',masterDDL);
  for(const schema of tenants)await ensureSchema({query:sql=>client.query(sql)},schema,tenantDDL);
  await client.query('COMMIT');
  await client.query("INSERT INTO knockout_master.master_users(name,pin) VALUES('Original Master','654321')");
  for(const schema of tenants){
   await client.query(`INSERT INTO knockout_master.companies(company_name,database_name,admin_name) VALUES($1,$1,'Owner')`,[schema]);
   await client.query(`INSERT INTO ${schema}.settings(hotel_name,updated_at) VALUES('Existing hotel','2020-01-01T00:00:00Z')`);
   await client.query(`INSERT INTO ${schema}.users(name,role,pin,active) VALUES('Existing Owner','admin','123456',false)`);
   await client.query(`ALTER TABLE ${schema}.users DROP COLUMN email, DROP COLUMN profile_image_url, DROP COLUMN profile_image_object`);
   await client.query(`DROP TABLE ${schema}.stock_requests`);
  }
  await client.query('DROP VIEW knockout_master.tenant_waiting_list,knockout_master.tenant_registrations');
  await client.query('ALTER TABLE knockout_master.company_registration_requests DROP COLUMN temporary_pin,DROP COLUMN selected_modules,DROP COLUMN completed_at');
  await client.query('DROP TABLE knockout_master.notification_outbox');
  for(let pass=0;pass<2;pass++){
   await client.query(master);await client.query(companies);
   for(const schema of tenants){
    const user=(await client.query(`SELECT id,name,pin,active,email,profile_image_url FROM ${schema}.users`)).rows[0];
    assert.deepEqual(user,{id:1,name:'Existing Owner',pin:'123456',active:false,email:'',profile_image_url:null});
    assert.equal((await client.query(`SELECT updated_at FROM ${schema}.settings`)).rows[0].updated_at.toISOString(),'2020-01-01T00:00:00.000Z');
    assert.equal((await client.query(`SELECT count(*) FROM ${schema}.stock_requests`)).rows[0].count,0);
   }
   assert.equal((await client.query('SELECT pin FROM knockout_master.master_users')).rows[0].pin,'654321');
   assert.equal((await client.query('SELECT count(*) FROM knockout_master.tenant_waiting_list')).rows[0].count,0);
  }
  assert.equal((await client.query("INSERT INTO tenant_alpha.users(name,role,pin) VALUES('Next','waiter','123457') RETURNING id")).rows[0].id,2);
  // Prove partial additions roll back when a populated table needs a required business value.
  await client.query('ALTER TABLE knockout.settings DROP COLUMN currency');
  await client.query('ALTER TABLE knockout.users DROP COLUMN name');
  await assert.rejects(client.query(companies),error=>error.code==='23502');
  await client.query('ROLLBACK');
  assert.equal((await client.query("SELECT count(*) FROM information_schema.columns WHERE table_schema='knockout' AND table_name='settings' AND column_name='currency'")).rows[0].count,0);
  assert.equal((await client.query('SELECT pin FROM knockout.users')).rows[0].pin,'123456');
  // An unexpected tenant name must abort instead of silently skipping a registered company.
  await client.query("UPDATE knockout_master.companies SET database_name='unexpected_schema' WHERE database_name='knockout'");
  await assert.rejects(client.query(companies),/Unexpected registered company schema/);await client.query('ROLLBACK');
 }finally{await client.end();await control.query(`DROP DATABASE "${database}" WITH (FORCE)`);await control.end()}
});
