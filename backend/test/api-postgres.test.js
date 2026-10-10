import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import pg from 'pg';
import {WebSocket} from 'ws';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));

test('PostgreSQL service flows through actual APIs',{skip:!process.env.PG_INTEGRATION,timeout:90000},async()=>{
 const db=`knockout_api_test_${process.pid}`;
 const control=new pg.Client({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.PGDATABASE||'knockout'});
 await control.connect();await control.query(`CREATE DATABASE "${db}"`);
 const children=[];let logs='';const clients=[];
 const env={...process.env,PGDATABASE:db,DB_NAME:'knockout',MASTER_DB_NAME:'knockout_master',SEED_DEMO_DATA:'true',MASTER_BOOTSTRAP_PIN:'654321',REDIS_URL:'',STATE_CACHE_TTL_MS:'100',NOTIFICATION_WEBHOOK_URL:'',SMS_WEBHOOK_URL:'',EMAIL_WEBHOOK_URL:''};
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function launch(){
  const port=56100;
  const child=spawn(process.execPath,['--import','./test/fixtures/storage-loader.mjs','src/main.js'],{cwd:root,env:{...env,PORT:String(port)}});children.push(child);child.stdout.on('data',data=>logs+=data);child.stderr.on('data',data=>logs+=data);
  for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return}catch{}await sleep(200)}throw new Error('API did not start: '+logs);
 }
 const tokens={};
 async function request(role,path,{method='GET',body,status=200,token,headers={}}={}){
  const port=56100;
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
  assert.equal(children.length,1);
  for(const role of ['waiter','chef','juicer']){const view=await request(role,'/state');assert.equal(view.users,undefined);assert.equal(view.financeEntries,undefined)}
  await request('waiter','/companies',{status:404});

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
  const juice=await request('admin','/menu',{method:'POST',body:{name:'Test juice',category:'Juices',price:30},status:201});
  const juiceTable=await request('admin','/tables',{method:'POST',body:{number:998,seats:2,area:'Test'},status:201});
  const juiceOrder=await request('waiter','/orders',{method:'POST',body:{tableId:juiceTable.id,items:[{menuId:juice.id,qty:1}],waiter:'Test Waiter'},status:201});
  await request('juicer',`/orders/${juiceOrder.id}/items/status`,{method:'PATCH',body:{status:'preparing',batchNo:1}});
  await request('juicer',`/orders/${juiceOrder.id}/items/status`,{method:'PATCH',body:{status:'ready',batchNo:1}});
  await request('waiter','/bookings',{method:'POST',body:{},status:403});
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
  const views=await Promise.all(Array.from({length:12},(_,i)=>request(i%2?'admin':'master','/state',{token:i%2?tokens.admin:login.accessToken,headers:{'x-company-database':i%2?company.databaseName:'knockout','x-portal-role':'admin'}})));
  views.forEach((view,i)=>assert.equal(view.settings.hotelName,i%2?state.settings.hotelName:'Postgres Test Company'));
  const profile=new FormData();profile.set('name','Updated Owner');profile.set('email','owner@example.com');profile.set('image',new Blob(['fixture'],{type:'image/png'}),'avatar.png');
  const upload=await fetch('http://127.0.0.1:56100/api/profile',{method:'PATCH',headers:{authorization:`Bearer ${login.accessToken}`},body:profile});assert.equal(upload.status,200,await upload.clone().text());
  const relogin=await request('anonymous','/public/resolve-login',{method:'POST',body:{hotelId:company.hotelId,pin:company.adminPin}});assert.equal(relogin.name,'Updated Owner');
  const socket=new WebSocket(`ws://127.0.0.1:56100/ws?database=${company.databaseName}&token=${login.accessToken}`);
  const connected=await once(socket,'message');assert.equal(JSON.parse(connected[0]).type,'connected');
  const changed=once(socket,'message');
  const nextItem=await request('master','/menu',{method:'POST',token:login.accessToken,body:{name:'Tenant item',category:'Main Course',price:9},status:201});assert(nextItem.id>menu.id);
  const [event]=await changed;assert.equal(JSON.parse(event).database,company.databaseName);socket.close();

  const duplicate=await request('master','/companies',{method:'POST',body:{companyName:'Postgres Test Company',adminName:'Owner'},status:409});assert(duplicate.message);
  await request('master','/state',{token:login.accessToken});
  const network=await request('master','/state');assert(network.companies.length>=2);assert(network.companies.every(company=>company.online), logs);
  await request('master','/module-pricing/tables',{method:'PATCH',body:{price:500}});
  const again=await request('master','/state');const invoice=again.invoices[0];await request('master',`/saas-invoices/${invoice.id}/status`,{method:'PATCH',body:{status:'paid'}});
  await fixture.query("UPDATE knockout_master.companies SET modules=jsonb_set(modules,'{stock}','false') WHERE id=$1",[company.id]);
  await request('master','/inventory',{method:'POST',token:login.accessToken,body:{},status:403});
  await fixture.query("UPDATE knockout_master.companies SET status='suspended' WHERE id=$1",[company.id]);
  await request('master','/state',{token:login.accessToken,status:403});
  await request('master',`/companies/${company.id}`,{method:'DELETE',body:{companyName:'Postgres Test Company'}});
 }finally{
  await Promise.all(children.map(async child=>{if(child.exitCode!==null)return;child.kill('SIGTERM');await Promise.race([once(child,'exit'),sleep(2000)]);if(child.exitCode===null){child.kill('SIGKILL');assert.fail('Unified backend did not shut down gracefully')}assert.equal(child.exitCode,0,logs.slice(-1500))}));
  for(const client of clients)await client.end();
  await control.query(`DROP DATABASE "${db}" WITH (FORCE)`);await control.end();
 }
});
