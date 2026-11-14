import test from 'node:test';
import assert from 'node:assert/strict';
import {createPool} from '../src/postgres.js';
import {ensureSchema,tenantDDL} from '../src/schema.js';
import {getDashboard} from '../src/dashboard.js';
import {tenantContextMiddleware} from '../src/middleware/tenant.js';
import {getStateController,clearStateCache} from '../src/controllers/tenant.controller.js';
import {closePools} from '../src/database.js';

test('dashboard: authoritative paid revenue, timezone boundaries, zero days and tenant/cache isolation',{skip:!process.env.PG_DASHBOARD_TEST},async()=>{
 const control=createPool({database:'public'}),names=[`tenant_dashboard_a_${process.pid}`,`tenant_dashboard_b_${process.pid}`],pools=[];
 try{
  for(const name of names){const c=await control.getConnection();try{await c.beginTransaction();await ensureSchema(c,name,tenantDDL);await c.query("INSERT INTO settings(id,hotel_name,timezone) VALUES(1,'Dashboard test','Pacific/Auckland')");await c.commit()}finally{c.release()}pools.push(createPool({database:name}))}
  const [a,b]=pools;
  let d=await getDashboard(a);assert.equal(d.todayRevenue,0);assert.equal(d.growthPercent,0);assert.equal(d.revenueDays.length,7);assert(d.revenueDays.every(x=>x.revenue===0));assert.equal(d.occupancyPercent,0);assert.equal(d.lowStock,0);assert.equal(d.totalTables,0);
  const [[clock]]=await a.query("SELECT ((CURRENT_TIMESTAMP AT TIME ZONE 'Pacific/Auckland')::date::timestamp AT TIME ZONE 'Pacific/Auckland') AS midnight");
  const midnight=new Date(clock.midnight),today=new Date(midnight.getTime()+60000),yesterday=new Date(midnight.getTime()-1);
  const insert=async(p,status,payment,total,completed)=>p.query('INSERT INTO orders(status,payment_status,total,created_at,completed_at) VALUES(?,?,?,NOW(),?)',[status,payment,total,completed]);
  await insert(a,'completed','paid',100,yesterday);
  d=await getDashboard(a);assert.equal(d.growthPercent,-100);assert.equal(d.todayRevenue,0);assert.equal(d.yesterdayRevenue,100);
  await insert(a,'completed','paid',150,today);await insert(a,'completed','paid',50,midnight);
  await insert(a,'completed','unpaid',900,today);await insert(a,'preparing','paid',800,null);
  d=await getDashboard(a);assert.equal(d.todayRevenue,200);assert.equal(d.growthPercent,100);assert.equal(d.revenueDays.reduce((sum,x)=>sum+x.revenue,0),300);assert.equal(d.activeOrders,1);
  await insert(b,'completed','paid',1200,today);const other=await getDashboard(b);assert.equal(other.todayRevenue,1200);assert.equal(other.growthKind,'new-sales');assert.equal(other.growthPercent,null);
  await a.query("INSERT INTO restaurant_tables(table_number,seats,area,status) VALUES(1,2,'Main','occupied'),(2,2,'Main','reserved'),(3,2,'Main','cleaning'),(4,2,'Main','available')");
  await a.query("INSERT INTO inventory(name,quantity,unit,min_quantity,cost) VALUES('Low',1,'kg',2,1),('Enough',10,'kg',2,1)");
  d=await getDashboard(a);assert.equal(d.occupancyPercent,25);assert.equal(d.lowStock,1);
  // Current production schema has no cancellation/refund order states or refund ledger.
  // Relax only these isolated test constraints to prove unsupported states cannot count as sales.
  const [constraints]=await a.query("SELECT conname FROM pg_constraint WHERE conrelid='orders'::regclass AND contype='c'");
  for(const {conname} of constraints)await a.query(`ALTER TABLE orders DROP CONSTRAINT "${conname.replaceAll('"','""')}"`);
  await insert(a,'cancelled','paid',5000,today);await insert(a,'voided','paid',5000,today);await insert(a,'completed','refunded',5000,today);
  assert.equal((await getDashboard(a)).todayRevenue,200);
  async function state(company,claimed){let output;const req={portalSession:{role:'admin',companyDatabase:company},headers:{'x-company-database':claimed,'x-portal-role':'admin'}};const res={set(){},json(x){output=x},status(code){throw new Error('Unexpected '+code)}};
   await new Promise((resolve,reject)=>tenantContextMiddleware(req,res,()=>getStateController(req,res).then(resolve,reject)));return output;}
  clearStateCache();const values=await Promise.all([state(names[0],names[1]),state(names[1],names[0]),state(names[0],names[1])]);
  assert.deepEqual(values.map(x=>x.dashboard.todayRevenue),[200,1200,200]);assert.deepEqual(values.map(x=>x.companyDatabase),[names[0],names[1],names[0]]);
  let status;tenantContextMiddleware({headers:{'x-company-database':names[0]}},{status(code){status=code;return this},json(){}},()=>assert.fail('Header-only tenant accepted'));assert.equal(status,401);
  const preserved=await getDashboard(a);assert.equal(preserved.todayRevenue,200);
 }finally{clearStateCache();await closePools();for(const p of pools)await p.end();for(const name of names)await control.query(`DROP SCHEMA IF EXISTS ${name} CASCADE`);await control.end()}
});
