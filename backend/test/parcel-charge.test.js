import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('parcel charge: validation, totals, locking, retries, dine-in untouched',{skip:!process.env.PG_TEMPLATE_TEST,timeout:120000},async t=>{
 const db=`knockout_parcel_${process.pid}`,port=56119,base={host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD};
 const control=new pg.Client({...base,database:process.env.PGDATABASE||'postgres'});await control.connect();await control.query(`CREATE DATABASE "${db}"`);
 const env={...process.env,PORT:String(port),MASTER_SESSION_SECRET:'isolated-test-signing-key-not-for-deployment',PGDATABASE:db,DB_NAME:'knockout',MASTER_DB_NAME:'knockout_master',SEED_DEMO_DATA:'true',MASTER_BOOTSTRAP_PIN:'654321',REDIS_URL:'',NOTIFICATION_WEBHOOK_URL:'',SMS_WEBHOOK_URL:'',EMAIL_WEBHOOK_URL:''};
 let child,logs='',client;
 const launch=async()=>{child=spawn(process.execPath,['--import','./test/fixtures/cancellation-loader.mjs','src/main.js'],{cwd:root,env});child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return}catch{}await new Promise(r=>setTimeout(r,200))}throw new Error(logs)};
 const stop=async()=>{if(child&&child.exitCode===null){child.kill('SIGTERM');await once(child,'exit')}};
 try{
  await launch();client=new pg.Client({...base,database:db});await client.connect();const q=async(s,v)=>(await client.query(s,v)).rows;
  await q("UPDATE knockout.users SET pin=lpad(id::text,6,'1')");await q("UPDATE knockout_master.company_users cu SET pin=u.pin FROM knockout.users u JOIN knockout_master.companies c ON c.database_name='knockout' WHERE cu.company_id=c.id AND cu.tenant_user_id=u.id");
  const pin=role=>q(`SELECT pin FROM knockout.users WHERE role='${role}' AND active LIMIT 1`).then(r=>r[0].pin);
  const login=async p=>(await (await fetch(`http://127.0.0.1:${port}/api/public/resolve-login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({hotelId:'1234',pin:p})})).json());
  const admin=await login(await pin('admin')),waiter=await login(await pin('waiter'));
  const call=async(u,path,method='GET',body)=>{const r=await fetch(`http://127.0.0.1:${port}/api${path}`,{method,headers:{'content-type':'application/json',authorization:`Bearer ${u.accessToken}`,'x-portal-role':u.role},body:body===undefined?undefined:JSON.stringify(body)});return{code:r.status,body:await r.json().catch(()=>null)}};
  const [menu]=await q('SELECT id FROM knockout.menu_items WHERE available ORDER BY id LIMIT 1');await q('UPDATE knockout.menu_items SET price=150 WHERE id=$1',[menu.id]);
  const parcel=async(extra={})=>{const r=await call(admin,'/parcels','POST',{customerName:'Test',items:[{menuId:menu.id,qty:1}],...extra});assert.equal(r.code,201,JSON.stringify(r.body));return r.body.id};
  const row=id=>q('SELECT subtotal,parcel_charge,total,payment_status,status FROM knockout.orders WHERE id=$1',[id]).then(r=>r[0]);

  await t.test('₹150 food + ₹20 charge = ₹170, recorded once at payment',async()=>{
   const id=await parcel();assert.equal(Number((await row(id)).parcel_charge),0);
   for(const v of[-1,'abc',1.234,100001])assert.equal((await call(admin,`/orders/${id}/parcel-charge`,'PUT',{parcelCharge:v})).code,400,String(v));
   assert.equal((await call(waiter,`/orders/${id}/parcel-charge`,'PUT',{parcelCharge:20})).code,403);
   for(let i=0;i<3;i++){const r=await call(admin,`/orders/${id}/parcel-charge`,'PUT',{parcelCharge:20});assert.equal(r.code,200);assert.equal(r.body.bill.total,170)}
   assert.equal((await call(admin,`/orders/${id}/bill`)).body.total,170);
   await q("UPDATE knockout.orders SET status='ready' WHERE id=$1",[id]);
   const fin=await call(admin,`/orders/${id}/finalize`,'POST',{paymentMethod:'Cash',parcelCharge:20});assert.equal(fin.code,200,JSON.stringify(fin.body));assert.equal(fin.body.bill.total,170);assert.equal(fin.body.bill.parcelCharges,20);
   const again=await call(admin,`/orders/${id}/finalize`,'POST',{paymentMethod:'Cash',parcelCharge:20});assert.equal(again.code,200);assert.equal(again.body.bill.total,170,'retry returns the same total');
   const r=await row(id);assert.equal(Number(r.subtotal),150);assert.equal(Number(r.parcel_charge),20);assert.equal(Number(r.total),170);
   assert.equal((await call(admin,`/orders/${id}/bill`)).body.total,170,'reprint');
  });
  await t.test('charge is locked after payment, including advance payment',async()=>{
   const done=(await q("SELECT id FROM knockout.orders WHERE order_type='parcel' AND status='completed' LIMIT 1"))[0].id;
   assert.equal((await call(admin,`/orders/${done}/parcel-charge`,'PUT',{parcelCharge:5})).code,409);
   assert.equal((await call(admin,`/orders/${done}/finalize`,'POST',{paymentMethod:'Cash',parcelCharge:5})).code,409);
   const id=await parcel();assert.equal((await call(admin,`/orders/${id}/mark-paid`,'POST',{paymentMethod:'Card / UPI',parcelCharge:12.5})).body.bill.total,162.5);
   assert.equal((await call(admin,`/orders/${id}/parcel-charge`,'PUT',{parcelCharge:0})).code,409);
   const retry=await call(admin,`/orders/${id}/mark-paid`,'POST',{paymentMethod:'Card / UPI'});assert.equal(retry.code,200);assert.equal(retry.body.bill.total,162.5);
   await q("UPDATE knockout.orders SET status='ready' WHERE id=$1",[id]);const fin=await call(admin,`/orders/${id}/finalize`,'POST',{});assert.equal(fin.code,200);assert.equal(Number((await row(id)).total),162.5);
  });
  await t.test('zero charge leaves the bill unchanged; paid-at-creation honours the charge',async()=>{
   const id=await parcel();await call(admin,`/orders/${id}/parcel-charge`,'PUT',{parcelCharge:0});assert.equal((await call(admin,`/orders/${id}/bill`)).body.total,150);assert.equal((await call(admin,`/orders/${id}/bill`)).body.parcelCharges,0);
   const paid=await parcel({paymentMethod:'Cash',parcelCharge:20});assert.equal(Number((await row(paid)).total),170);
  });
  await t.test('dine-in orders cannot take a parcel charge and keep their totals',async()=>{
   const [o]=await q("INSERT INTO knockout.orders (order_type,guest_name,status,created_at,parcel_charge) VALUES ('dine_in','T','ready',NOW(),0) RETURNING id");await q('INSERT INTO knockout.order_items (order_id,menu_id,quantity,price) VALUES ($1,$2,2,150)',[o.id,menu.id]);
   assert.equal((await call(admin,`/orders/${o.id}/parcel-charge`,'PUT',{parcelCharge:20})).code,400);
   assert.equal((await call(admin,`/orders/${o.id}/finalize`,'POST',{paymentMethod:'Cash',parcelCharge:20})).code,400);
   await q("UPDATE knockout.orders SET parcel_charge=99 WHERE id=$1",[o.id]);assert.equal((await call(admin,`/orders/${o.id}/bill`)).body.total,300,'a stray value never reaches a dine-in bill');
  });
  await t.test('reports and dashboard revenue use the final total',async()=>{
   const [{sum}]=await q("SELECT SUM(total)::float sum FROM knockout.orders WHERE payment_status='paid' AND order_type='parcel'");assert.equal(sum,170+162.5+170);
   const state=(await call(admin,'/state')).body;const p=state.orders.find(o=>o.orderType==='parcel'&&Number(o.parcelCharges)===20);assert(p,'state exposes parcelCharges');
  });
  await t.test('split payment: Cash + Card / UPI must add up to the bill; reports see each part',async()=>{
   const id=await parcel({parcelCharge:20});await q("UPDATE knockout.orders SET status='ready' WHERE id=$1",[id]);
   const fin=(body)=>call(admin,`/orders/${id}/finalize`,'POST',body);
   for(const payments of[[{method:'Cash',amount:100},{method:'Card / UPI',amount:50}],[{method:'Cash',amount:170},{method:'Card / UPI',amount:0}],[{method:'Cash',amount:100},{method:'Cash',amount:70}],[{method:'Cash',amount:100.123},{method:'Card / UPI',amount:69.877}],[{method:'Bitcoin',amount:100},{method:'Cash',amount:70}],[{method:'Cash',amount:170}]])assert.equal((await fin({payments})).code,400,JSON.stringify(payments));
   assert.equal((await fin({paymentMethod:'Cheque'})).code,400,'unknown single method rejected');
   assert.equal((await q('SELECT payment_status FROM knockout.orders WHERE id=$1',[id]))[0].payment_status,'unpaid','rejected splits record nothing');
   const ok=await fin({payments:[{method:'Card / UPI',amount:69.5},{method:'Cash',amount:100.5}]});assert.equal(ok.code,200,JSON.stringify(ok.body));
   assert.equal(ok.body.paymentMethod,'Split');assert.deepEqual(ok.body.paymentSplit,[{method:'Cash',amount:100.5},{method:'Card / UPI',amount:69.5}]);assert.ok(ok.body.billNumber);
   const again=await fin({payments:[{method:'Cash',amount:1},{method:'Card / UPI',amount:169}]});assert.equal(again.code,200);assert.equal(again.body.billNumber,ok.body.billNumber,'retry keeps the bill number');assert.deepEqual(again.body.paymentSplit,ok.body.paymentSplit,'retry keeps the recorded split');
   const r=await row(id);assert.equal(Number(r.total),170);assert.equal(r.payment_status,'paid');
   const st=(await call(admin,'/state')).body.orders.find(o=>o.id==id);assert.equal(st.paymentMethod,'Split');assert.equal(st.paymentSplit.reduce((s,p)=>s+p.amount,0),170);
   const adv=await parcel();const mp=await call(admin,`/orders/${adv}/mark-paid`,'POST',{payments:[{method:'Cash',amount:75},{method:'Card / UPI',amount:75}]});assert.equal(mp.code,200,JSON.stringify(mp.body));assert.equal(mp.body.paymentMethod,'Split');
   assert.equal((await call(admin,`/orders/${adv}/mark-paid`,'POST',{payments:[{method:'Cash',amount:10},{method:'Card / UPI',amount:10}]})).body.paymentSplit[0].amount,75,'advance split retry unchanged');
   assert.equal((await call(waiter,`/orders/${adv}/finalize`,'POST',{payments:[{method:'Cash',amount:75},{method:'Card / UPI',amount:75}]})).code,403,'waiter cannot record payments');
  });
  await t.test('split migration SQL is repeatable',async()=>{for(let i=0;i<2;i++)await client.query(await readFile(new URL('../../migrations/staging/10-split-payment.sql',import.meta.url),'utf8'))});
  await t.test('migration SQL is repeatable',async()=>{for(let i=0;i<2;i++)await client.query(await readFile(new URL('../../migrations/staging/09-parcel-charge.sql',import.meta.url),'utf8'));assert.equal((await q("SELECT COUNT(*)::int n FROM information_schema.columns WHERE column_name='parcel_charge'"))[0].n>0,true)});
 }finally{if(process.env.SHOW_LOGS)console.log(logs.slice(-2500));await stop();await client?.end();await control.query(`DROP DATABASE IF EXISTS "${db}" WITH (FORCE)`);await control.end()}
});
