import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createPool} from '../src/postgres.js';
import {ensureSchema,tenantDDL} from '../src/schema.js';
import {closePools} from '../src/database.js';
import {createRoleRouter} from '../src/routes/portal.routes.js';

test('independent table groups through HTTP and PostgreSQL',{skip:!process.env.PG_GROUP_TEST},async t=>{
 const schema=`tenant_groups_test_${process.pid}`,other=`tenant_groups_other_${process.pid}`,control=createPool({database:'public'}),db=createPool({database:schema}),events=[];let server;
 const row=async id=>(await db.query('SELECT * FROM orders WHERE id=?',[id]))[0][0];
 try{
 for(const name of[schema,other]){const c=await control.getConnection();try{await c.beginTransaction();await ensureSchema(c,name,tenantDDL);await ensureSchema(c,name,tenantDDL);await c.commit()}finally{c.release()}}
 await db.query("INSERT INTO settings(id,hotel_name) VALUES(1,'Cancellation test')");await db.query("INSERT INTO users(id,name,role,pin) VALUES(1,'Waiter','waiter','test'),(2,'Admin','admin','test2'),(3,'Chef','chef','test3'),(4,'Juicer','juicer','test4')");await db.query("INSERT INTO restaurant_tables(id,table_number,seats,area) VALUES(1,1,4,'Test'),(2,2,4,'Test')");await db.query("INSERT INTO menu_items(id,name,category,price) VALUES(1,'Food','Mains',50),(2,'Juice','Juices',50)");
 const app=express();app.use(express.json());const routers=Object.fromEntries(['waiter','admin','chef','juicer'].map(role=>[role,createRoleRouter(role)]));
 // Test-only identity injection: production uses verified signed tokens before these routers.
 app.use((req,res,next)=>{const role=req.headers['x-test-role']||'waiter';req.portalSession={id:{waiter:1,admin:2,chef:3,juicer:4}[role],role,companyDatabase:req.headers['x-test-tenant']||schema};res.on('finish',()=>{if(req.method!=='GET'&&res.statusCode<400&&!res.locals.skipMutation)events.push({tenant:req.portalSession.companyDatabase,...res.locals.broadcastDetails})});routers[role](req,res,next)});
 app.use((err,req,res,next)=>res.status(err.status||500).json({message:err.message}));server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s))});
 const call=async(path,method='POST',role='waiter',body={},tenant=schema)=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/api${path}`,{method,headers:{'Content-Type':'application/json','X-Test-Role':role,'X-Test-Tenant':tenant},...(method==='GET'?{}:{body:JSON.stringify(body)})});return{code:r.status,body:await r.json()}};
 const session=async(name,count,key=crypto.randomUUID(),tableId=1)=>call(`/tables/${tableId}/sessions`,'POST','waiter',{guestName:name,guestCount:count,requestKey:key});
 const add=(id,menuId,qty=1,batchNo=1)=>call(`/orders/${id}/items`,'POST','waiter',{items:[{menuId,qty}],batchNo});
 const ready=async(id,role,batchNo)=>{for(const status of ['preparing','ready'])assert.equal((await call(`/orders/${id}/items/status`,'PATCH',role,{status,batchNo})).code,200);assert.equal((await call(`/orders/${id}/batches/${batchNo}/handoff`,'PATCH',role,{status:'collected'})).code,200);assert.equal((await call(`/orders/${id}/batches/${batchNo}/handoff`,'PATCH','waiter',{status:'received'})).code,200)};
 await t.test('two groups share T01, pay independent bills and leave separately',async()=>{
 const [a,b]=await Promise.all([session('Group A',2),session('Group B',3)]);assert.equal(a.code,201);assert.equal(b.code,201);assert.notEqual(a.body.id,b.body.id);const A=a.body.id,B=b.body.id;
 assert.equal((await add(A,1,2)).code,201);assert.equal((await add(B,2,3)).code,201);
 await ready(A,'chef',1);assert.equal((await row(B)).status,'new');
 assert.equal((await call(`/orders/${A}/request-bill`)).code,200);
 const paidA=await call(`/orders/${A}/finalize`,'POST','admin',{paymentMethod:'Cash'});assert.equal(paidA.code,200);assert.equal(paidA.body.bill.total,100);
 let table=(await db.query('SELECT * FROM restaurant_tables WHERE id=1'))[0][0];assert.equal(table.status,'occupied');assert.equal(table.order_id,B);
 assert.equal((await add(B,1,1,2)).code,201);assert.equal((await call(`/orders/${A}/items`,'POST','waiter',{items:[{menuId:1,qty:1}]})).code,409);
 await ready(B,'juicer',1);await ready(B,'chef',2);assert.equal((await call(`/orders/${B}/request-bill`)).code,200);
 const paidB=await call(`/orders/${B}/finalize`,'POST','admin',{paymentMethod:'Card / UPI'});assert.equal(paidB.code,200);assert.equal(paidB.body.bill.total,200);assert.notEqual(paidA.body.billNumber,paidB.body.billNumber);
 table=(await db.query('SELECT * FROM restaurant_tables WHERE id=1'))[0][0];assert.equal(table.status,'available');assert.equal(table.order_id,null);
 const state=await call('/state','GET','admin');assert.equal(state.body.orders.find(o=>o.id===A).guestCount,2);assert.equal(state.body.orders.find(o=>o.id===B).guestCount,3);assert.equal(state.body.orders.find(o=>o.id===A).total,100);assert.equal(state.body.orders.find(o=>o.id===B).total,200);
 const repeat=await call(`/orders/${A}/finalize`,'POST','admin',{paymentMethod:'Cash'});assert.equal(repeat.body.billNumber,paidA.body.billNumber);assert.equal(repeat.body.bill.total,100);
 });
 await t.test('duplicate creation is idempotent; cancelling empty group keeps another occupied',async()=>{const key=crypto.randomUUID();const results=await Promise.all([session('Solo',1,key),session('Solo',1,key)]);assert.equal(results[0].body.id,results[1].body.id);const id=results[0].body.id;const otherGroup=await session('Other',3);assert.equal((await call(`/orders/${id}/finalize`,'POST','admin',{paymentMethod:'Cash'})).code,409);assert.equal((await call(`/orders/${id}/cancel`)).code,200);const [[table]]=await db.query('SELECT * FROM restaurant_tables WHERE id=1');assert.equal(table.order_id,otherGroup.body.id);assert.equal(table.status,'occupied');await call(`/orders/${otherGroup.body.id}/cancel`);assert.equal((await db.query('SELECT status FROM restaurant_tables WHERE id=1'))[0][0].status,'available')});
 await t.test('invalid guests, forbidden roles and cross-tenant targets fail',async()=>{for(const count of[0,-1,1.5,201])assert.equal((await session('Invalid',count)).code,400);for(const role of['admin','chef','juicer'])assert.equal((await call('/tables/1/sessions','POST',role,{guestCount:1,requestKey:crypto.randomUUID()})).code,403);assert.equal((await call('/tables/1/sessions','POST','waiter',{guestCount:1,requestKey:crypto.randomUUID()},other)).code,403)});
 await t.test('explicit session and table mismatches cannot add items',async()=>{const a=await session('Identity check',1);for(const identity of [{sessionId:a.body.id+1000},{tableId:2}])assert.equal((await call(`/orders/${a.body.id}/items`,'POST','waiter',{...identity,items:[{menuId:1,qty:1}]})).code,409);assert.equal((await db.query('SELECT * FROM order_items WHERE order_id=?',[a.body.id]))[0].length,0);await call(`/orders/${a.body.id}/cancel`)});
 await t.test('reservation locks remain respected and legacy paid data survives migration',async()=>{
 const [booking]=await db.query("INSERT INTO bookings(table_id,guest_name,booking_date,booking_time,duration_minutes,status) VALUES(2,'Reserved',CURRENT_DATE,to_char(NOW()-INTERVAL '1 minute','HH24:MI'),90,'confirmed')");
 assert.equal((await session('Walk in',1,crypto.randomUUID(),2)).code,409);
 await db.query("UPDATE bookings SET status='cancelled' WHERE id=?",[booking.insertId]);
 const [old]=await db.query("INSERT INTO orders(table_id,waiter,status,payment_status,total,bill_number,bill_date,created_at) VALUES(2,'Waiter','completed','paid',123,99,CURRENT_DATE,NOW())");
 const before=await row(old.insertId);const conn=await db.getConnection();try{await conn.beginTransaction();await ensureSchema(conn,schema,tenantDDL);await conn.commit()}finally{conn.release()};assert.deepEqual(await row(old.insertId),before);assert.equal(before.guest_count,null);assert.equal(before.session_key,null);
 });
 await t.test('admin table editing preserves sessions and rejects invalid, duplicate, stale and unauthorized changes',async()=>{
 const group=await session('Editing occupied table',2);const before=await row(group.body.id);const [[table]]=await db.query('SELECT * FROM restaurant_tables WHERE id=1');
 const body={number:11,seats:6,area:'Terrace',previous:{number:table.table_number,seats:table.seats,area:table.area}};
 assert.equal((await call('/tables/1','PATCH','waiter',body)).code,403);
 assert.equal((await call('/tables/1','PATCH','admin',body,other)).code,403);
 const edited=await call('/tables/1','PATCH','admin',body);assert.equal(edited.code,200);assert.equal(edited.body.number,11);
 const [[updated]]=await db.query('SELECT * FROM restaurant_tables WHERE id=1');assert.equal(updated.status,table.status);assert.equal(updated.order_id,table.order_id);assert.equal(updated.active_booking_id,table.active_booking_id);assert.deepEqual(await row(group.body.id),before);
 assert.equal((await call('/tables/1','PATCH','admin',body)).code,409);
 assert.equal((await call('/tables/1','PATCH','admin',{number:2,seats:6,area:'Hall'})).code,409);
 for(const bad of [{number:0},{seats:1.5},{area:''},{area:'x'.repeat(81)}])assert.equal((await call('/tables/1','PATCH','admin',{number:11,seats:6,area:'Hall',...bad})).code,400);
 assert.equal((await call('/tables/999999','PATCH','admin',{number:12,seats:4,area:'Hall'})).code,404);
 await call(`/orders/${group.body.id}/cancel`);assert.equal((await call('/tables/1','PATCH','admin',{number:1,seats:4,area:'Test'})).code,200);
 });
 await t.test('empty-group cancellation cannot cancel food added by another waiter',async()=>{
 const group=await session('Accidental group',1);await add(group.body.id,1);
 assert.equal((await call(`/orders/${group.body.id}/cancel`,'POST','waiter',{emptyOnly:true})).code,409);
 assert.equal((await row(group.body.id)).status,'new');assert.equal((await db.query('SELECT * FROM order_items WHERE order_id=?',[group.body.id]))[0].length,1);
 await call(`/orders/${group.body.id}/cancel`);
 const empty=await session('Empty',1);assert.equal((await call(`/orders/${empty.body.id}/cancel`,'POST','waiter',{emptyOnly:true})).code,200);
 assert.equal((await db.query('SELECT status FROM restaurant_tables WHERE id=1'))[0][0].status,'available');
 assert.equal((await db.query('SELECT * FROM order_cancellations WHERE order_id=?',[empty.body.id]))[0].length,1);
 });
 await t.test('closing sessions concurrently does not strand or release a live table early',async()=>{const a=await session('One',1),b=await session('Two',1);await add(a.body.id,1);await add(b.body.id,2);const paid=await Promise.all([call(`/orders/${a.body.id}/finalize`,'POST','admin',{paymentMethod:'Cash'}),call(`/orders/${b.body.id}/finalize`,'POST','admin',{paymentMethod:'Cash'})]);assert(paid.every(x=>x.code===200));assert.notEqual(paid[0].body.billNumber,paid[1].body.billNumber);assert.equal((await db.query('SELECT status FROM restaurant_tables WHERE id=1'))[0][0].status,'available')});
 }finally{if(server)await new Promise(r=>server.close(r));await closePools();await db.end();for(const name of[schema,other])await control.query(`DROP SCHEMA IF EXISTS "${name}" CASCADE`);await control.end()}
});
