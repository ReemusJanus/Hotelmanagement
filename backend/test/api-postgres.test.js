import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import pg from 'pg';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));

test('PostgreSQL service flows through actual APIs',{skip:!process.env.PG_INTEGRATION,timeout:90000},async()=>{
 const db=`knockout_api_test_${process.pid}`;
 const control=new pg.Client({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.PGDATABASE||'knockout'});
 await control.connect();await control.query(`CREATE DATABASE "${db}"`);
 const children=[];let logs='';const clients=[];
 const env={...process.env,PGDATABASE:db,DB_NAME:'knockout',MASTER_DB_NAME:'knockout_master',SEED_DEMO_DATA:'true',MASTER_BOOTSTRAP_PIN:'654321',REDIS_URL:'',STATE_CACHE_TTL_MS:'100',NOTIFICATION_WEBHOOK_URL:'',SMS_WEBHOOK_URL:'',EMAIL_WEBHOOK_URL:''};
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function launch(role,port){
  const child=spawn(process.execPath,['--import','./test/fixtures/storage-loader.mjs',role==='master'?'src/main-master.js':'src/main.js'],{cwd:root,env:{...env,PORT:String(port),PORTAL_ROLE:role,ADMIN_API_URL:'http://127.0.0.1:56101',WAITER_API_URL:'http://127.0.0.1:56102',CHEF_API_URL:'http://127.0.0.1:56103',JUICER_API_URL:'http://127.0.0.1:56104'}});children.push(child);child.stdout.on('data',data=>logs+=data);child.stderr.on('data',data=>logs+=data);
  for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return}catch{}await sleep(200)}throw new Error('API did not start: '+logs);
 }
 const tokens={};
 async function request(role,path,{method='GET',body,status=200,token}={}){
  const port=role==='master'?56100:({admin:56101,waiter:56102,chef:56103,juicer:56104})[role];
  const response=await fetch(`http://127.0.0.1:${port}/api${path}`,{method,headers:{'content-type':'application/json',...(token||tokens[role]?{authorization:`Bearer ${token||tokens[role]}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json();assert.equal(response.status,status,`${role} ${method} ${path}: ${JSON.stringify(data)}\n${logs.slice(-1500)}`);return data;
 }
 try{
  await launch('admin',56101);await launch('waiter',56102);await launch('chef',56103);await launch('juicer',56104);await launch('master',56100);
  assert.equal((await request('admin','/health')).database,'postgresql');
  const state=await request('admin','/state');assert(state.settings.hotelName);assert(state.menu[0].imageUrl!==undefined);assert.equal(typeof state.users[0].id,'number');
  const menu=await request('admin','/menu',{method:'POST',body:{name:'Test dish',category:'Main Course',price:100},status:201});
  const table=await request('admin','/tables',{method:'POST',body:{number:999,seats:4,area:'Test'},status:201});
  const order=await request('waiter','/orders',{method:'POST',body:{tableId:table.id,items:[{menuId:menu.id,qty:2}],waiter:'Test Waiter'},status:201});
  await request('waiter',`/orders/${order.id}/items`,{method:'POST',body:{items:[{menuId:menu.id,qty:1}]},status:201});
  for(const batchNo of [1,2]){
   await request('chef',`/orders/${order.id}/items/status`,{method:'PATCH',body:{status:'preparing',batchNo}});
   await request('chef',`/orders/${order.id}/items/status`,{method:'PATCH',body:{status:'ready',batchNo}});
   await request('chef',`/orders/${order.id}/batches/${batchNo}/handoff`,{method:'PATCH',body:{status:'collected'}});
   await request('waiter',`/orders/${order.id}/batches/${batchNo}/handoff`,{method:'PATCH',body:{status:'received'}});
  }
  await request('waiter',`/orders/${order.id}/request-bill`,{method:'POST',body:{}});
  const bill=await request('admin',`/orders/${order.id}/finalize`,{method:'POST',body:{paymentMethod:'Cash'}});assert.equal(bill.bill.total,300);
  const booking=await request('admin','/bookings',{method:'POST',body:{tableId:table.id,bookingDate:'2030-06-01',bookingTime:'12:00',durationMinutes:90,customerPhone:'9876543210'},status:201});
  await request('admin','/bookings',{method:'POST',body:{tableId:table.id,bookingDate:'2030-06-01',bookingTime:'12:30',durationMinutes:90,customerPhone:'9876543210'},status:409});
  await request('admin',`/bookings/${booking.id}`,{method:'DELETE'});
  const stock=await request('admin','/inventory',{method:'POST',body:{name:'Test stock',quantity:10,unit:'kg',min:2,cost:5},status:201});
  await request('admin',`/inventory/${stock.id}/movements`,{method:'POST',body:{movementType:'usage',quantity:2},status:201});
  const purchase=await request('admin','/supplier-purchases',{method:'POST',body:{supplierName:'Test supplier',description:'Goods',purchaseDate:'2026-10-10',totalAmount:100,paidAmount:20},status:201});
  await request('admin',`/supplier-purchases/${purchase.id}/payments`,{method:'POST',body:{amount:80,paymentDate:'2026-10-10'},status:201});
  await request('admin',`/supplier-purchases/${purchase.id}/payments`,{method:'POST',body:{amount:1,paymentDate:'2026-10-10'},status:409});
  const waiter=state.users.find(user=>user.role==='waiter');
  await request('waiter',`/attendance/${waiter.id}/check-in`,{method:'POST',body:{},status:201});await request('waiter',`/attendance/${waiter.id}/check-out`,{method:'POST',body:{}});
  const master=await request('master','/login',{method:'POST',body:{pin:'654321'}});tokens.master=master.accessToken;
  const company=await request('master','/companies',{method:'POST',body:{companyName:'Postgres Test Company',adminName:'Owner',email:'test@example.com'},status:201});
  const login=await request('master','/public/resolve-login',{method:'POST',body:{hotelId:company.hotelId,pin:company.adminPin}});assert(login.accessToken);
  const tenantState=await request('master','/state',{token:login.accessToken});assert.equal(tenantState.settings.hotelName,'Postgres Test Company');assert.equal(tenantState.orders.length,0);
  const nextItem=await request('master','/menu',{method:'POST',token:login.accessToken,body:{name:'Tenant item',category:'Main Course',price:9},status:201});assert(nextItem.id>menu.id);
  const duplicate=await request('master','/companies',{method:'POST',body:{companyName:'Postgres Test Company',adminName:'Owner'},status:409});assert(duplicate.message);
  await request('master','/state',{token:login.accessToken});
  const network=await request('master','/state');assert(network.companies.length>=2);assert(network.companies.every(company=>company.online), logs);
  await request('master','/module-pricing/tables',{method:'PATCH',body:{price:500}});
  const again=await request('master','/state');const invoice=again.invoices[0];await request('master',`/saas-invoices/${invoice.id}/status`,{method:'PATCH',body:{status:'paid'}});
  await request('master',`/companies/${company.id}`,{method:'DELETE',body:{companyName:'Postgres Test Company'}});
 }finally{
  await Promise.all(children.map(async child=>{if(child.exitCode!==null)return;child.kill('SIGTERM');await Promise.race([once(child,'exit'),sleep(2000)]);if(child.exitCode===null)child.kill('SIGKILL')}));
  for(const client of clients)await client.end();
  await control.query(`DROP DATABASE "${db}" WITH (FORCE)`);await control.end();
 }
});
