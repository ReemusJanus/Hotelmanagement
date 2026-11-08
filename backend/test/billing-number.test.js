import test from 'node:test';
import assert from 'node:assert/strict';
import {createPool} from '../src/postgres.js';
import {assignDailyBillNumber} from '../src/billing-number.js';
test('daily bills: reset, tenant isolation, concurrency and reprints',{skip:!process.env.PG_BILL_TEST},async()=>{
 const control=createPool({database:'public'}), schemas=[`bill_test_a_${process.pid}`,`bill_test_b_${process.pid}`],pools=[];
 try{
  for(const schema of schemas){
   await control.query(`CREATE SCHEMA ${schema}`);
   await control.query(`CREATE TABLE ${schema}.orders(id int PRIMARY KEY,bill_number int,bill_date date,UNIQUE(bill_date,bill_number))`);
   await control.query(`INSERT INTO ${schema}.orders SELECT n,NULL,NULL FROM generate_series(1,12) n RETURNING id`);
   pools.push(createPool({database:schema}));
  }
  async function issue(pool,id){const conn=await pool.getConnection();try{await conn.beginTransaction();const number=await assignDailyBillNumber(conn,id);await conn.commit();return number;}catch(e){await conn.rollback();throw e}finally{conn.release()}}
  await pools[0].query('UPDATE orders SET bill_number=99,bill_date=CURRENT_DATE-1 WHERE id=12');
  const first=await issue(pools[0],1);assert.equal(first.billNumber,1);
  assert.deepEqual(await issue(pools[0],1),first);
  const concurrent=await Promise.all([2,3,4,5,6].map(id=>issue(pools[0],id)));
  assert.deepEqual(concurrent.map(n=>n.billNumber).sort((a,b)=>a-b),[2,3,4,5,6]);
  assert.equal((await issue(pools[1],1)).billNumber,1);
  const same=await Promise.all([issue(pools[0],7),issue(pools[0],7)]);assert.deepEqual(same[0],same[1]);assert.equal(same[0].billNumber,7);
 }finally{for(const p of pools)await p.end();for(const s of schemas)await control.query(`DROP SCHEMA IF EXISTS ${s} CASCADE`);await control.end()}
});
