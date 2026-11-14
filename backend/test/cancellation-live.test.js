import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import pg from 'pg';
import crypto from 'node:crypto';
import {WebSocket} from 'ws';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));

test('real login, cancellation API and kitchen/juicer WebSocket delivery',{skip:!process.env.PG_CANCELLATION_LIVE_TEST,timeout:90000},async()=>{
 const db=`knockout_cancel_api_${process.pid}`;
 const control=new pg.Client({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.PGDATABASE||'knockout'});
 await control.connect();await control.query(`CREATE DATABASE "${db}"`);
 const children=[];let logs='';const clients=[];
 const env={...process.env,MASTER_SESSION_SECRET:'isolated-test-signing-key-not-for-deployment',PGDATABASE:db,DB_NAME:'knockout',MASTER_DB_NAME:'knockout_master',SEED_DEMO_DATA:'true',MASTER_BOOTSTRAP_PIN:'654321',REDIS_URL:'',STATE_CACHE_TTL_MS:'100',NOTIFICATION_WEBHOOK_URL:'',SMS_WEBHOOK_URL:'',EMAIL_WEBHOOK_URL:''};
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function launch(){
  const port=56109;
  const child=spawn(process.execPath,['--import','./test/fixtures/cancellation-loader.mjs','src/main.js'],{cwd:root,env:{...env,PORT:String(port)}});children.push(child);child.stdout.on('data',data=>logs+=data);child.stderr.on('data',data=>logs+=data);
  for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return}catch{}await sleep(200)}throw new Error('API did not start: '+logs);
 }
 const tokens={};
 async function request(role,path,{method='GET',body,status=200,token,headers={}}={}){
  const port=56109;
  const response=await fetch(`http://127.0.0.1:${port}/api${path}`,{method,headers:{...headers,'content-type':'application/json',...(token||tokens[role]?{authorization:`Bearer ${token||tokens[role]}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json();assert.equal(response.status,status,`${role} ${method} ${path}: ${JSON.stringify(data)}\n${logs.slice(-1500)}`);return data;
 }
 try{
  await launch();
  const fixture=new pg.Client({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:db});await fixture.connect();clients.push(fixture);
  await fixture.query("INSERT INTO knockout.users(name,role,pin) VALUES('Test Juicer','juicer','987654')");
  await fixture.query("INSERT INTO knockout_master.company_users(company_id,tenant_user_id,name,role,pin,phone,active) SELECT c.id,u.id,u.name,u.role,u.pin,'',true FROM knockout_master.companies c CROSS JOIN knockout.users u WHERE c.database_name='knockout' AND u.role='juicer'");
  await fixture.query("UPDATE knockout.users SET pin=lpad(id::text,6,'1')");
  await fixture.query("UPDATE knockout_master.company_users cu SET pin=u.pin FROM knockout.users u WHERE cu.tenant_user_id=u.id");
  const users=(await fixture.query('SELECT role,pin FROM knockout.users WHERE active=true ORDER BY id')).rows;
  for(const role of ['admin','waiter','chef','juicer']){
   const user=users.find(user=>user.role===role);assert(user,role+' fixture missing');
   tokens[role]=(await request('anonymous','/public/resolve-login',{method:'POST',body:{hotelId:'1234',pin:user.pin}})).accessToken;
  }
  await request('anonymous','/state',{status:401,headers:{'x-portal-role':'admin','x-company-database':'knockout'}});
  await request('anonymous','/state',{token:'invalid',status:401});
  const expiredPayload=Buffer.from(JSON.stringify({id:1,role:'admin',companyDatabase:'knockout',exp:Date.now()-1000})).toString('base64url');
  const expired=expiredPayload+'.'+crypto.createHmac('sha256',env.MASTER_SESSION_SECRET).update(expiredPayload).digest('base64url');
  await request('anonymous','/state',{token:expired,status:401});
  await request('anonymous','/state',{token:tokens.admin+'.extra',status:401});

  const menu=await request('admin','/menu',{method:'POST',body:{name:'Cancel test food',category:'Mains',price:50},status:201});
  const juice=await request('admin','/menu',{method:'POST',body:{name:'Cancel test juice',category:'Juices',price:30},status:201});
  const table=await request('admin','/tables',{method:'POST',body:{number:999,seats:4,area:'Test'},status:201});
  const order=await request('waiter','/orders',{method:'POST',body:{tableId:table.id,items:[{menuId:menu.id,qty:2},{menuId:juice.id,qty:1}]},status:201});
  const sockets=[];
  try{
   for(const role of ['waiter','chef','juicer']){const ws=new WebSocket(`ws://127.0.0.1:56109/ws?database=knockout&token=${tokens[role]}`);sockets.push(ws);assert.equal(JSON.parse((await once(ws,'message'))[0]).type,'connected')}
   const updates=sockets.map(ws=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Cancellation broadcast timeout')),5000);ws.on('message',raw=>{const event=JSON.parse(raw);if(event.action==='order_cancelled'&&event.orderId===order.id){clearTimeout(timer);resolve(event)}})}));
   await request('anonymous',`/orders/${order.id}/cancel`,{method:'POST',body:{},status:401});
   await request('chef',`/orders/${order.id}/cancel`,{method:'POST',body:{},status:403});
   const cancelled=await request('waiter',`/orders/${order.id}/cancel`,{method:'POST',body:{reason:'Customer changed plans'}});assert.equal(cancelled.status,'cancelled');
   for(const event of await Promise.all(updates)){assert.equal(event.type,'state.changed');assert.equal(event.database,'knockout');assert.equal(event.status,'cancelled')}
   for(const role of ['waiter','chef','juicer']){const view=await request(role,'/state');assert.equal(view.orders.find(o=>o.id===order.id).status,'cancelled');assert.equal(view.tables.find(t=>t.id===table.id).orderId,null)}
   await request('juicer',`/orders/${order.id}/items/status`,{method:'PATCH',body:{status:'preparing',batchNo:1},status:409});
   const rows=await fixture.query('SELECT * FROM knockout.order_cancellations WHERE order_id=$1',[order.id]);assert.equal(rows.rows.length,1);assert.equal(rows.rows[0].reason,'Customer changed plans');assert.equal(rows.rows[0].items.length,2);
   assert(!/UnhandledPromiseRejection|uncaughtException/.test(logs),logs);
  }finally{sockets.forEach(ws=>ws.close())}
 }catch(error){console.error(error.message);console.error(logs);throw error}
 finally{
  await Promise.all(children.map(async child=>{if(child.exitCode!==null)return;child.kill('SIGTERM');await Promise.race([once(child,'exit'),sleep(2000)]);if(child.exitCode===null){child.kill('SIGKILL')}}));
  for(const client of clients)await client.end();
  await control.query(`DROP DATABASE "${db}" WITH (FORCE)`);await control.end();
 }
});
