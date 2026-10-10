import test from 'node:test';
import assert from 'node:assert/strict';
import {bindParameters,quoteIdentifier,createPool} from '../src/postgres.js';
import {ensureSchema,tenantDDL,masterDDL,syncSequences} from '../src/schema.js';

test('bind markers never replace literals, identifiers, comments or function bodies',()=>{
 assert.equal(bindParameters(`SELECT ?, '?', "?", $$?$$, $body$?$body$, ? -- ?\n/* ? /* ? */ ? */`),`SELECT $1, '?', "?", $$?$$, $body$?$body$, $2 -- ?\n/* ? /* ? */ ? */`);
 assert.equal(bindParameters("SELECT 'it''s ?', ?"),"SELECT 'it''s ?', $1");
 assert.throws(()=>quoteIdentifier('tenant_a; DROP SCHEMA public'));
});

test('real PostgreSQL schema, contracts, constraints, isolation, transactions and sequences',{skip:!process.env.PG_INTEGRATION},async()=>{
 const p=createPool();const c=await p.getConnection();
 try{
  await c.beginTransaction();
  await ensureSchema(c,'tenant_test_a',tenantDDL);
  await ensureSchema(c,'tenant_test_b',tenantDDL);
  await ensureSchema(c,'master_test',masterDDL);
  await ensureSchema(c,'master_test',masterDDL); // idempotent boot
  await c.query('SET LOCAL search_path TO tenant_test_a,pg_catalog');
  const [u]=await c.query("INSERT INTO users(name,role,pin) VALUES (?,'waiter',?)",['A','123456']);assert.equal(u.insertId,1);
  const[[row]]=await c.query('SELECT id,name,active,created_at "createdAt" FROM users WHERE id=?',[u.insertId]);assert.equal(row.active,true);assert(row.createdAt instanceof Date);
  await c.query("INSERT INTO restaurant_tables(table_number,seats,area) VALUES(1,4,'Main')");
  await c.query("INSERT INTO bookings(table_id,booking_date,booking_time) VALUES(1,?,'12:00')",['2030-01-01']);
  const[[date]]=await c.query('SELECT booking_date "bookingDate" FROM bookings');assert.equal(date.bookingDate,'2030-01-01');
  await c.query("INSERT INTO menu_items(id,name,category,price) VALUES(100,'Combo','Food',100)");await syncSequences(c,'tenant_test_a');
  const[item]=await c.query("INSERT INTO menu_items(name,category,price) VALUES('Next','Food',1)");assert.equal(item.insertId,101);
  await c.query('SET LOCAL search_path TO tenant_test_b,pg_catalog');const[[count]]=await c.query('SELECT COUNT(*) count FROM users');assert.equal(count.count,0);
  await c.query('SAVEPOINT invalid_role');await assert.rejects(c.query("INSERT INTO users(name,role,pin) VALUES('Invalid','guest','0')"),e=>e.code==='23514');await c.query('ROLLBACK TO invalid_role');
  await c.query('SAVEPOINT invalid_fk');await assert.rejects(c.query('INSERT INTO staff_attendance(user_id,check_in) VALUES(999,NOW())'),e=>e.code==='23503');await c.query('ROLLBACK TO invalid_fk');
  await c.rollback();const[[gone]]=await c.query("SELECT COUNT(*) count FROM information_schema.schemata WHERE schema_name='tenant_test_a'");assert.equal(gone.count,0);
 }finally{await c.rollback();c.release();await p.end()}
});
