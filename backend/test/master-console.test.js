import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('Superadmin console: appearance is per Superadmin, audit and activity, health, authorization',{skip:!process.env.PG_TEMPLATE_TEST,timeout:120000},async t=>{
 const db=`knockout_console_${process.pid}`,port=56118,base={host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD};
 const control=new pg.Client({...base,database:process.env.PGDATABASE||'postgres'});await control.connect();await control.query(`CREATE DATABASE "${db}"`);
 const env={...process.env,PORT:String(port),MASTER_SESSION_SECRET:'isolated-test-signing-key-not-for-deployment',PGDATABASE:db,DB_NAME:'knockout',MASTER_DB_NAME:'knockout_master',SEED_DEMO_DATA:'true',MASTER_BOOTSTRAP_PIN:'654321',REDIS_URL:'',NOTIFICATION_WEBHOOK_URL:'',SMS_WEBHOOK_URL:'',EMAIL_WEBHOOK_URL:''};
 let child,logs='',client;
 const launch=async()=>{child=spawn(process.execPath,['--import','./test/fixtures/cancellation-loader.mjs','src/main.js'],{cwd:root,env});child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return}catch{}await new Promise(r=>setTimeout(r,200))}throw new Error(logs)};
 const stop=async()=>{if(child&&child.exitCode===null){child.kill('SIGTERM');await once(child,'exit')}};
 const call=async(token,path,method='GET',body)=>{const r=await fetch(`http://127.0.0.1:${port}/api${path}`,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return{code:r.status,body:await r.json().catch(()=>null)}};
 const login=async(hotelId,pin)=>{const r=await call(null,'/public/resolve-login','POST',{hotelId,pin});assert.equal(r.code,200,JSON.stringify(r.body));return r.body};
 try{
  await launch();client=new pg.Client({...base,database:db});await client.connect();const q=async(s,v)=>(await client.query(s,v)).rows;
  const m1=await login('','654321');const master=m1.accessToken;
  await q("INSERT INTO knockout_master.master_users(name,pin) VALUES('Second Superadmin','765432')");const m2=(await login('','765432')).accessToken;
  const made=await call(master,'/companies','POST',{companyName:'Second House',adminName:'Maya'});assert.equal(made.code,201);
  await q("UPDATE knockout.users SET pin=lpad(id::text,6,'1')");await q("UPDATE knockout_master.company_users cu SET pin=u.pin FROM knockout.users u JOIN knockout_master.companies c ON c.database_name='knockout' WHERE cu.company_id=c.id AND cu.tenant_user_id=u.id");
  const admin=(await login('1234',(await q("SELECT pin FROM knockout.users WHERE role='admin' AND active LIMIT 1"))[0].pin)).accessToken;
  const tpl=Object.fromEntries((await q('SELECT code,id FROM knockout_master.ui_templates')).map(x=>[x.code,Number(x.id)]));
  const tenants=async()=>q('SELECT id,template_id,template_change_count FROM knockout_master.companies ORDER BY id');

  await t.test('unauthenticated and tenant users cannot use console endpoints',async()=>{
   for(const [p,m,b] of[['/master/activity'],['/master/health'],['/master/appearance'],['/master/appearance','PUT',{templateId:tpl['glass-dark']}]]){assert.equal((await call(null,p,m,b)).code,401);assert.notEqual((await call(admin,p,m,b)).code,200)}
  });
  await t.test('Superadmin appearance: unlimited, per account, separate from tenants and allowance',async()=>{
   const before=await tenants();assert.equal((await call(master,'/master/appearance')).body.current,null);
   for(const code of['glass-dark','glass-light','aurora-glass','royal','midnight-glass','classic','glass-dark']){const r=await call(master,'/master/appearance','PUT',{templateId:tpl[code]});assert.equal(r.code,200);assert.equal(r.body.current.code,code)}
   assert.equal((await call(m2,'/master/appearance')).body.current,null,'another Superadmin is unaffected');
   assert.deepEqual(await tenants(),before,'tenant templates and change counts unchanged');
   assert.equal((await call(master,'/state')).body.appearance.code,'glass-dark');assert.equal((await login('','654321')).appearance.code,'glass-dark');
   assert.equal((await call(master,'/master/appearance','PUT',{templateId:'x'})).code,400);assert.equal((await call(master,'/master/appearance','PUT',{templateId:999999})).code,404);
   await q("UPDATE knockout_master.ui_templates SET active=FALSE WHERE code='glass-dark'");assert.equal((await call(master,'/master/appearance')).body.current,null,'inactive template falls back');assert.equal((await call(master,'/master/appearance','PUT',{templateId:tpl['glass-dark']})).code,404);await q("UPDATE knockout_master.ui_templates SET active=TRUE WHERE code='glass-dark'");
   assert.equal((await call(master,'/master/appearance','PUT',{templateId:null})).body.current,null);
   const state=(await call(master,'/state')).body;assert(state.companies.every(c=>c.templateCode&&c.templateName&&'templateChangesUsed' in c));
  });
  await t.test('administrative actions are audited and appear in tenant activity',async()=>{
   const B=made.body.id;
   assert.equal((await call(master,`/companies/${B}/status`,'PATCH',{status:'suspended'})).code,200);assert.equal((await call(master,`/companies/${B}/status`,'PATCH',{status:'active'})).code,200);
   assert.equal((await call(master,`/companies/${B}/modules`,'PATCH',{module:'juicer',enabled:false})).code,200);
   assert.equal((await call(master,`/companies/${B}/template`,'PATCH',{templateId:tpl['aurora-glass']})).code,200);
   const ev=(await call(master,`/master/activity?companyId=${B}`)).body.events;const actions=ev.map(e=>e.action);
   for(const a of['company.created','company.suspended','company.activated','module.disabled','template.superadmin'])assert(actions.includes(a),a);
   assert(ev.every(e=>Number(e.companyId)===Number(B)),'scoped to one tenant');assert(ev.find(e=>e.action==='company.suspended').actor);
   assert(!JSON.stringify(ev).match(/\b\d{6}\b.*pin/i));
   assert.equal((await call(master,'/master/activity?companyId=abc')).code,400);
   const all=(await call(master,'/master/activity?limit=500')).body.events;assert(all.length<=200&&all.length>=5);
  });
  await t.test('health reports measured values only',async()=>{
   const h=(await call(master,'/master/health')).body;assert.equal(h.database.ok,true);assert(h.database.latencyMs>=0);assert(h.uptimeSeconds>=0&&h.memoryMb>0);assert.equal(h.realtime.provider,'memory');assert(h.notifications&&Number.isInteger(h.notifications.queued));
  });
  await t.test('migration SQL is repeatable and restart keeps preferences',async()=>{
   await call(master,'/master/appearance','PUT',{templateId:tpl['glass-light']});
   for(let i=0;i<2;i++)await client.query(await readFile(new URL('../../migrations/staging/08-superadmin-console.sql',import.meta.url),'utf8'));await client.query('RESET search_path');
   await stop();await launch();assert.equal((await call(master,'/master/appearance')).body.current.code,'glass-light');
  });
 }finally{if(process.env.SHOW_LOGS)console.log(logs.slice(-2500));await stop();await client?.end();await control.query(`DROP DATABASE IF EXISTS "${db}" WITH (FORCE)`);await control.end()}
});
