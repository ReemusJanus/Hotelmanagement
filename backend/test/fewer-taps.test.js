import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import pg from 'pg';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));

test('fewer-taps server rules: booking availability, seated release, default parcel name',{skip:!process.env.PG_TEMPLATE_TEST,timeout:120000},async t=>{
 const db=`knockout_taps_${process.pid}`,port=56121,base={host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD};
 const control=new pg.Client({...base,database:process.env.PGDATABASE||'postgres'});await control.connect();await control.query(`CREATE DATABASE "${db}"`);
 const env={...process.env,PORT:String(port),MASTER_SESSION_SECRET:'isolated-test-signing-key-not-for-deployment',PGDATABASE:db,DB_NAME:'knockout',MASTER_DB_NAME:'knockout_master',SEED_DEMO_DATA:'true',MASTER_BOOTSTRAP_PIN:'654321',REDIS_URL:'',NOTIFICATION_WEBHOOK_URL:'',SMS_WEBHOOK_URL:'',EMAIL_WEBHOOK_URL:''};
 let child,logs='',client;
 const launch=async()=>{child=spawn(process.execPath,['--import','./test/fixtures/cancellation-loader.mjs','src/main.js'],{cwd:root,env});child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return}catch{}await new Promise(r=>setTimeout(r,200))}throw new Error(logs)};
 const stop=async()=>{if(child&&child.exitCode===null){child.kill('SIGTERM');await once(child,'exit')}};
 try{
  await launch();client=new pg.Client({...base,database:db});await client.connect();const q=async(s,v)=>(await client.query(s,v)).rows;
  await q("UPDATE knockout.users SET pin=lpad(id::text,6,'1')");await q("UPDATE knockout_master.company_users cu SET pin=u.pin FROM knockout.users u JOIN knockout_master.companies c ON c.database_name='knockout' WHERE cu.company_id=c.id AND cu.tenant_user_id=u.id");
  await q('UPDATE knockout.settings SET reservation_early_minutes=15 WHERE id=1');
  const pin=role=>q(`SELECT pin FROM knockout.users WHERE role='${role}' AND active LIMIT 1`).then(r=>r[0].pin);
  const login=async p=>(await (await fetch(`http://127.0.0.1:${port}/api/public/resolve-login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({hotelId:'1234',pin:p})})).json());
  const admin=await login(await pin('admin')),waiter=await login(await pin('waiter'));
  const call=async(u,path,method='GET',body)=>{const r=await fetch(`http://127.0.0.1:${port}/api${path}`,{method,headers:{'content-type':'application/json',authorization:`Bearer ${u.accessToken}`,'x-portal-role':u.role},body:body===undefined?undefined:JSON.stringify(body)});return{code:r.status,body:await r.json().catch(()=>null)}};
  const at=async minutes=>(await q(`SELECT to_char(NOW()+($1::int)*INTERVAL '1 minute','YYYY-MM-DD') d,to_char(NOW()+($1::int)*INTERVAL '1 minute','HH24:MI') t`,[minutes]))[0];
  const book=async(tableId,minutes,extra={})=>{const {d,t:time}=await at(minutes);return call(admin,'/bookings','POST',{tableId,bookingDate:d,bookingTime:time,durationMinutes:60,customerPhone:'+919000000001',guestName:'Rule test',...extra})};
  const [menu]=await q('SELECT id FROM knockout.menu_items WHERE available ORDER BY id LIMIT 1');
  const [busy]=await q("SELECT t.id FROM knockout.restaurant_tables t WHERE t.active AND EXISTS(SELECT 1 FROM knockout.orders o WHERE o.table_id=t.id AND o.status NOT IN ('completed','cancelled')) ORDER BY t.id LIMIT 1");
  const free=await q("SELECT t.id,t.seats FROM knockout.restaurant_tables t WHERE t.active AND t.status='available' AND t.seats>=4 AND NOT EXISTS(SELECT 1 FROM knockout.orders o WHERE o.table_id=t.id AND o.status NOT IN ('completed','cancelled')) ORDER BY t.id LIMIT 2");
  const soon=(await at(20)).d===(await at(0)).d,later=(await at(150)).d===(await at(0)).d;

  await t.test('occupied table cannot be booked within the hour; later is fine; capacity enforced',{skip:!soon||!later},async()=>{
   const blocked=await book(busy.id,20);assert.equal(blocked.code,409);assert.match(blocked.body.message,/occupied now/);
   assert.equal((await book(busy.id,150)).code,201,'an occupied table can still take a later booking');
   assert.equal((await book(free[0].id,20,{guestCount:free[0].seats+1})).code,400,'over capacity rejected');
   assert.equal((await book(free[0].id,20,{guestCount:2})).code,201,'free table within the hour accepted');
   assert.equal((await book(free[0].id,30)).code,409,'overlapping booking still locked');
  });

  await t.test('cancelling the last empty group of a seated booking releases the table',{skip:!soon},async()=>{
   const made=await book(free[1].id,5,{guestCount:3,guestName:'Arrival'});assert.equal(made.code,201,JSON.stringify(made.body));
   assert.equal((await call(waiter,`/bookings/${made.body.id}/check-in`,'POST',{})).code,200);
   const group=await call(waiter,`/tables/${free[1].id}/sessions`,'POST',{guestCount:3,guestName:'Arrival',bookingId:made.body.id,requestKey:`taps-${process.pid}-seated-1`});assert.equal(group.code,201,JSON.stringify(group.body));
   const [o]=await q('SELECT guest_count,guest_name,booking_id FROM knockout.orders WHERE id=$1',[group.body.id]);assert.deepEqual([o.guest_count,o.guest_name,Number(o.booking_id)],[3,'Arrival',Number(made.body.id)]);
   const cancelled=await call(waiter,`/orders/${group.body.id}/cancel`,'POST',{reason:'',emptyOnly:true});assert.equal(cancelled.code,200,JSON.stringify(cancelled.body));
   const [tbl]=await q('SELECT status,active_booking_id,order_id FROM knockout.restaurant_tables WHERE id=$1',[free[1].id]);assert.deepEqual([tbl.status,tbl.active_booking_id,tbl.order_id],['available',null,null]);
   assert.equal((await q('SELECT status FROM knockout.bookings WHERE id=$1',[made.body.id]))[0].status,'cancelled');
   // A walk-in empty group never touches bookings.
   const walk=await call(waiter,`/tables/${free[1].id}/sessions`,'POST',{guestCount:2,guestName:'',requestKey:`taps-${process.pid}-walkin-1`});assert.equal(walk.code,201);
   assert.equal((await call(waiter,`/orders/${walk.body.id}/cancel`,'POST',{reason:'',emptyOnly:true})).code,200);
   assert.equal((await q('SELECT status FROM knockout.restaurant_tables WHERE id=$1',[free[1].id]))[0].status,'available');
  });

  await t.test('parcel name is optional and defaults to its parcel number',async()=>{
   const unnamed=await call(admin,'/parcels','POST',{customerName:'  ',items:[{menuId:menu.id,qty:2}]});assert.equal(unnamed.code,201);
   assert.equal((await q('SELECT guest_name FROM knockout.orders WHERE id=$1',[unnamed.body.id]))[0].guest_name,`Parcel #${unnamed.body.id}`);
   const named=await call(admin,'/parcels','POST',{customerName:' Ravi ',items:[{menuId:menu.id,qty:1}]});
   assert.equal((await q('SELECT guest_name FROM knockout.orders WHERE id=$1',[named.body.id]))[0].guest_name,'Ravi');
   assert.equal((await call(waiter,'/parcels','POST',{items:[{menuId:menu.id,qty:1}]})).code,403,'waiter still cannot create parcels');
  });
 }finally{if(process.env.SHOW_LOGS)console.log(logs.slice(-2500));await stop();await client?.end();await control.query(`DROP DATABASE IF EXISTS "${db}" WITH (FORCE)`);await control.end()}
});
