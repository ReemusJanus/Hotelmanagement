import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import crypto from 'node:crypto';
import pg from 'pg';
import {WebSocket} from 'ws';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('tenant UI templates: migration, isolation, authorization, audit, fallback',{skip:!process.env.PG_TEMPLATE_TEST,timeout:120000},async t=>{
 const db=`knockout_tpl_${process.pid}`,port=56117,base={host:process.env.DB_HOST,port:Number(process.env.DB_PORT),user:process.env.DB_USER,password:process.env.DB_PASSWORD};
 const control=new pg.Client({...base,database:process.env.PGDATABASE||'knockout'});await control.connect();await control.query(`CREATE DATABASE "${db}"`);
 const env={...process.env,PORT:String(port),MASTER_SESSION_SECRET:'isolated-test-signing-key-not-for-deployment',PGDATABASE:db,DB_NAME:'knockout',MASTER_DB_NAME:'knockout_master',SEED_DEMO_DATA:'true',MASTER_BOOTSTRAP_PIN:'654321',REDIS_URL:'',STATE_CACHE_TTL_MS:'100',NOTIFICATION_WEBHOOK_URL:'',SMS_WEBHOOK_URL:'',EMAIL_WEBHOOK_URL:''};
 let child,logs='',client;
 const launch=async()=>{child=spawn(process.execPath,['--import','./test/fixtures/cancellation-loader.mjs','src/main.js'],{cwd:root,env});child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);for(let i=0;i<150;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/health`)).ok)return}catch{}await new Promise(r=>setTimeout(r,200))}throw new Error(logs)};
 const stop=async()=>{if(child&&child.exitCode===null){child.kill('SIGTERM');await once(child,'exit')}};
 const call=async(token,path,method='GET',body,headers={})=>{const r=await fetch(`http://127.0.0.1:${port}/api${path}`,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});return{code:r.status,body:await r.json()}};
 const login=async(hotelId,pin)=>{const r=await call(null,'/public/resolve-login','POST',{hotelId,pin});assert.equal(r.code,200,JSON.stringify(r.body));return r.body};
 try{
  await launch();client=new pg.Client({...base,database:db});await client.connect();const q=async(s,v)=>(await client.query(s,v)).rows;
  const master=(await login('','654321')).accessToken;
  const made=await call(master,'/companies','POST',{companyName:'Second House',adminName:'Maya'});assert.equal(made.code,201,logs.slice(-800));
  await q("UPDATE knockout.users SET pin=lpad(id::text,6,'1')");await q('UPDATE knockout_master.company_users cu SET pin=u.pin FROM knockout.users u JOIN knockout_master.companies c ON c.database_name=\'knockout\' WHERE cu.company_id=c.id AND cu.tenant_user_id=u.id');
  const users=Object.fromEntries((await q('SELECT role,pin FROM knockout.users WHERE active')).map(u=>[u.role,u.pin]));
  const a=await login('1234',users.admin),waiter=await login('1234',users.waiter),b=await login(made.body.hotelId,made.body.adminPin);
  let reg;const refresh=async()=>reg=(await call(master,'/ui-templates')).body;await refresh();
  const id=code=>reg.templates.find(x=>x.code===code).id,company=name=>reg.assignments.find(x=>x.companyName===name);
  const A=company('KnockOUT 1').companyId,B=company('Second House').companyId;
  const assign=(c,template,extra={},token=master)=>call(token,`/companies/${c}/template`,'PATCH',{templateId:template,...extra});
  const seen=async token=>(await call(token,'/session')).body.template;

  await t.test('fifteen templates seeded; existing and new tenants get Classic',async()=>{
   assert.deepEqual(reg.templates.map(x=>x.code),['classic','luxury','modern','minimal','royal','midnight-dark','ocean-dark','emerald','amoled','modern-light','glass-light','glass-dark','midnight-glass','royal-gold-glass','aurora-glass']);assert(reg.templates.every(x=>x.active&&/^\d+\.\d+\.\d+$/.test(x.version)&&x.preview.description));
   for(const u of[a,waiter,b])assert.equal(u.template.code,'classic');assert.deepEqual(Object.keys(await seen(a.accessToken)).sort(),['code','id','version']);
   const tenantTables=await q("SELECT table_schema FROM information_schema.tables WHERE table_name IN('ui_templates','template_assignments')");assert(tenantTables.every(x=>x.table_schema==='knockout_master'));
  });
  await t.test('different tenants load different templates without re-login; live notice reaches only that tenant',async()=>{
   const events={a:[],b:[]};const sockets=await Promise.all([['a',a],['b',b]].map(async([k,u])=>{const ws=new WebSocket(`ws://127.0.0.1:${port}/ws?database=${u.companyDatabase}&token=${u.accessToken}`);ws.on('message',m=>events[k].push(JSON.parse(m)));await once(ws,'message');return ws}));
   assert.equal((await assign(A,id('royal'))).code,200);assert.equal((await assign(B,id('minimal'))).code,200);await new Promise(r=>setTimeout(r,300));
   assert.equal((await seen(a.accessToken)).code,'royal');assert.equal((await seen(waiter.accessToken)).code,'royal');assert.equal((await seen(b.accessToken)).code,'minimal');
   assert.deepEqual(events.a.filter(e=>e.resource==='company.template').map(e=>e.template.code),['royal']);assert.deepEqual(events.b.filter(e=>e.resource==='company.template').map(e=>e.template.code),['minimal']);sockets.forEach(s=>s.close());
   assert.equal((await login('1234',users.chef)).template.code,'royal');
  });
  await t.test('client-supplied tenant headers cannot change the resolved template',async()=>{const r=await call(a.accessToken,'/session','GET',undefined,{'x-company-database':b.companyDatabase});assert.equal(r.body.template.code,'royal');assert.equal(r.body.companyDatabase,'knockout')});
  await t.test('two tenants share a template independently',async()=>{await assign(A,id('modern'));await assign(B,id('modern'));await assign(A,id('luxury'));assert.equal((await seen(a.accessToken)).code,'luxury');assert.equal((await seen(b.accessToken)).code,'modern')});
  await t.test('only Superadmin can list or assign',async()=>{
   for(const[token,code]of[[a.accessToken,403],[waiter.accessToken,403],[null,401],['bad.token',401]]){assert.equal((await call(token,'/ui-templates')).code,code);assert.equal((await assign(A,id('minimal'),{},token)).code,code);assert.equal((await call(token,`/companies/${B}/template`,'PATCH',{templateId:id('classic')},{'x-portal-role':'superadmin'})).code,code)}
   assert.equal((await seen(a.accessToken)).code,'luxury');
   // A signed Superadmin token for a disabled account must not assign.
   await q('UPDATE knockout_master.master_users SET active=FALSE');assert.equal((await assign(A,id('minimal'))).code,403);await q('UPDATE knockout_master.master_users SET active=TRUE');
  });
  await t.test('invalid, missing, inactive and stale assignments are rejected',async()=>{
   for(const bad of[undefined,null,'2',1.5,-1,0])assert.equal((await assign(A,bad)).code,400);assert.equal((await assign('x',id('modern'))).code,400);assert.equal((await assign(A,99999)).code,404);assert.equal((await assign(99999,id('modern'))).code,404);
   await q("UPDATE knockout_master.ui_templates SET active=FALSE WHERE code='minimal'");assert.equal((await assign(A,id('minimal'))).code,409);
   assert.equal((await assign(A,id('modern'),{previousTemplateId:id('royal')})).code,409);assert.equal((await seen(a.accessToken)).code,'luxury');
  });
  await t.test('inactive assigned template falls back to Classic, and to a constant if Classic is unavailable',async()=>{
   await q("UPDATE knockout_master.ui_templates SET active=FALSE WHERE code='luxury'");assert.equal((await seen(a.accessToken)).code,'classic');
   await q("UPDATE knockout_master.ui_templates SET active=FALSE WHERE code='classic'");assert.deepEqual(await seen(a.accessToken),{id:null,code:'classic',version:'1.0.0'});
   await q('UPDATE knockout_master.ui_templates SET active=TRUE');assert.equal((await seen(a.accessToken)).code,'luxury');
  });
  await t.test('every change is audited once; repeats are not',async()=>{
   await refresh();const before=reg.history.length,r=await assign(A,id('luxury'));assert.equal(r.body.changed,false);await refresh();assert.equal(reg.history.length,before);
   const row=reg.history.find(h=>h.companyName==='KnockOUT 1');assert.equal(row.templateName,'Luxury');assert.equal(row.previousName,'Modern');assert.equal(row.assignedBy,'Byteberrytech Master');
   await Promise.all(['royal','modern','minimal'].map(c=>assign(B,id(c))));const rows=await q('SELECT previous_template_id p,template_id t FROM knockout_master.template_assignments WHERE company_id=$1 ORDER BY id DESC LIMIT 3',[B]);assert.equal(rows[0].p,rows[1].t);assert.equal(rows[1].p,rows[2].t);
  });
  await t.test('Admin self-service: three counted changes, then requests',async()=>{
   const get=async u=>(await call(u.accessToken,'/appearance')).body,change=(u,code,extra={})=>call(u.accessToken,'/appearance/template','POST',{templateId:id(code),...extra}),ask=(u,code,reason='Seasonal rebrand')=>call(u.accessToken,'/appearance/requests','POST',{templateId:id(code),reason});
   assert.equal((await get(a)).remaining,3);assert(!JSON.stringify(await get(a)).includes('Second House'));
   for(const u of[waiter,await login('1234',users.chef)]){assert.equal((await call(u.accessToken,'/appearance')).code,403);assert.equal((await change(u,'royal')).code,403);assert.equal((await ask(u,'royal')).code,403);assert.equal((await call(u.accessToken,'/appearance/seen','POST')).code,403)}
   assert.equal((await call(null,'/appearance/template','POST',{templateId:1})).code,401);assert.equal((await call(null,'/appearance',"GET",undefined,{'x-portal-role':'admin'})).code,401);
   const start=reg.templates.find(x=>x.id===(reg.assignments.find(c=>c.companyId===A).templateId)).code;
   assert.equal((await change(a,start)).body.changed,false);assert.equal((await call(a.accessToken,'/appearance/template','POST',{templateId:'2'})).code,400);assert.equal((await call(a.accessToken,'/appearance/template','POST',{templateId:99999})).code,404);assert.equal((await ask(a,'emerald')).code,409);assert.equal((await get(a)).remaining,3);
   await q("UPDATE knockout_master.ui_templates SET active=FALSE WHERE code='amoled'");assert.equal((await change(a,'amoled')).code,409);await q("UPDATE knockout_master.ui_templates SET active=TRUE WHERE code='amoled'");
   assert.equal((await change(a,'emerald',{previousTemplateId:99999})).code,409);assert.equal((await get(a)).remaining,3);
   const r1=await change(a,'emerald',{companyId:B,'x-company-database':b.companyDatabase});assert.equal(r1.body.remaining,2);assert.equal((await seen(a.accessToken)).code,'emerald');assert.notEqual((await seen(b.accessToken)).code,'emerald');
   // Eight simultaneous changes: exactly two more may succeed.
   const burst=await Promise.all(['royal','modern','minimal','luxury','ocean-dark','amoled','midnight-dark','modern-light'].map(c=>change(a,c)));assert.equal(burst.filter(x=>x.code===200&&x.body.changed).length,2);assert.equal(burst.filter(x=>x.code===409).length,6);
   assert.deepEqual(await q('SELECT template_change_count n FROM knockout_master.companies WHERE id=$1',[A]).then(x=>x[0].n),3);assert.equal((await get(a)).remaining,0);assert.equal((await get(b)).remaining,3);
   assert.equal((await change(a,'classic')).code,409);assert.equal((await ask(a,'classic','  hi ')).code,400);assert.equal((await ask(a,'classic','x'.repeat(501))).code,400);
   const both=await Promise.all([ask(a,'classic'),ask(a,'classic'),ask(a,'royal')]);assert.equal(both.filter(x=>x.code===201).length,1);assert.equal(both.filter(x=>x.code===409).length,2);
   const row=(await get(a)).requests[0];assert.equal(row.status,'pending');assert.equal((await get(b)).requests.length,0);assert.equal((await call(master,'/state')).body.pendingTemplateRequests,1);
   for(const t of[a,waiter,b])assert.equal((await call(t.accessToken,`/template-requests/${row.id}/review`,'POST',{decision:'approved'})).code,403);
   assert.equal((await call(null,`/template-requests/${row.id}/review`,'POST',{decision:'approved'})).code,401);for(const t of[a,b])assert.equal((await call(t.accessToken,`/companies/${A}/template-allowance/reset`,'POST')).code,403);
   assert.equal((await call(master,`/template-requests/${row.id}/review`,'POST',{decision:'maybe'})).code,400);assert.equal((await call(master,'/template-requests/99999/review','POST',{decision:'approved'})).code,404);
   const before=(await seen(a.accessToken)).code;assert.equal((await call(master,`/template-requests/${row.id}/review`,'POST',{decision:'rejected',note:'Keep brand'})).code,200);assert.equal((await seen(a.accessToken)).code,before);
   assert.equal((await call(a.accessToken,'/session')).body.templateNotice.status,'rejected');assert.equal((await call(waiter.accessToken,'/session')).body.templateNotice,null);assert.equal((await call(b.accessToken,'/session')).body.templateNotice,null);
   await call(b.accessToken,'/appearance/seen','POST');assert((await call(a.accessToken,'/session')).body.templateNotice);await call(a.accessToken,'/appearance/seen','POST');assert.equal((await call(a.accessToken,'/session')).body.templateNotice,null);
   const next=before==='amoled'?'royal':'amoled',second=await ask(a,next);assert.equal(second.code,201);
   const reviews=await Promise.all(['approved','rejected','approved'].map(decision=>call(master,`/template-requests/${second.body.id}/review`,'POST',{decision})));assert.equal(reviews.filter(x=>x.code===200).length,1);const final=(await get(a)).requests[0].status;assert.equal((await seen(a.accessToken)).code,final==='approved'?next:before);
   let third=final==='approved'?null:await ask(a,next);if(third)assert.equal((await call(master,`/template-requests/${third.body.id}/review`,'POST',{decision:'approved'})).code,200);
   assert.equal((await seen(a.accessToken)).code,next);assert.equal((await get(a)).remaining,0,'approval does not consume or restore allowance');
   const audit=(await q('SELECT source,request_id FROM knockout_master.template_assignments WHERE company_id=$1 ORDER BY id DESC LIMIT 1',[A]))[0];assert.equal(audit.source,'request');assert(audit.request_id);
   const fourth=await ask(a,'emerald');await q("UPDATE knockout_master.ui_templates SET active=FALSE WHERE code='emerald'");assert.equal((await call(master,`/template-requests/${fourth.body.id}/review`,'POST',{decision:'approved'})).code,409);assert.equal((await get(a)).requests[0].status,'pending');await q("UPDATE knockout_master.ui_templates SET active=TRUE WHERE code='emerald'");await call(master,`/template-requests/${fourth.body.id}/review`,'POST',{decision:'rejected'});
   // Superadmin is unlimited, and neither uses nor restores the tenant allowance.
   for(const c of['royal','modern','luxury','minimal','classic'])assert.equal((await assign(A,id(c))).body.changed,true);assert.equal((await get(a)).remaining,0);
   assert.equal((await call(master,`/companies/${B}/template-allowance/reset`,'POST')).code,409);assert.equal((await call(master,`/companies/${A}/template-allowance/reset`,'POST')).code,200);assert.equal((await get(a)).remaining,3);assert.equal((await q('SELECT previous_count n FROM knockout_master.template_allowance_resets'))[0].n,3);
   assert.equal((await change(a,'luxury')).body.remaining,2);await q("UPDATE knockout_master.company_users SET active=FALSE WHERE company_id=$1 AND role='admin'",[A]);assert.equal((await change(a,'royal')).code,403);await q("UPDATE knockout_master.company_users SET active=TRUE WHERE company_id=$1 AND role='admin'",[A]);
   await refresh();assert(reg.history.some(h=>h.source==='reset'));assert(reg.history.some(h=>h.source==='admin'));
  });
  await t.test('assigned templates cannot be deleted; migration SQL and restart are repeatable and keep assignments',async()=>{
   await assert.rejects(q("DELETE FROM knockout_master.ui_templates WHERE code='luxury'"),/foreign key/);
   const snapshot=await q('SELECT id,template_id FROM knockout_master.companies ORDER BY id');
   for(const f of['05-ui-templates','06-template-requests','06-template-requests']){await client.query(await readFile(new URL(`../../migrations/staging/${f}.sql`,import.meta.url),'utf8'))}await client.query('RESET search_path');
   await stop();await launch();assert.deepEqual(await q('SELECT id,template_id FROM knockout_master.companies ORDER BY id'),snapshot);assert.equal((await q('SELECT COUNT(*)::int n FROM knockout_master.ui_templates'))[0].n,15);
   // Insert in the shape an older backend uses.
   await q("INSERT INTO knockout_master.companies(company_name,database_name,admin_name) VALUES('Legacy Insert','tenant_legacy_insert','x')");assert.equal((await q("SELECT t.code FROM knockout_master.companies c JOIN knockout_master.ui_templates t ON t.id=c.template_id WHERE company_name='Legacy Insert'"))[0].code,'classic');await q("DELETE FROM knockout_master.companies WHERE company_name='Legacy Insert'");
  });
  await t.test('SQL upgrades a pre-template database and preserves every company',async()=>{
   await stop();await q('ALTER TABLE knockout_master.companies DROP COLUMN template_id,DROP COLUMN template_change_count');await q('DROP TABLE knockout_master.master_user_preferences,knockout_master.template_allowance_resets,knockout_master.template_assignments,knockout_master.template_change_requests,knockout_master.ui_templates');const before=await q('SELECT * FROM knockout_master.companies ORDER BY id');
   for(const f of['05-ui-templates','06-template-requests'])await client.query(await readFile(new URL(`../../migrations/staging/${f}.sql`,import.meta.url),'utf8'));await client.query('RESET search_path');
   const after=await q('SELECT c.*,t.code FROM knockout_master.companies c JOIN knockout_master.ui_templates t ON t.id=c.template_id ORDER BY c.id');assert(after.every(x=>x.code==='classic'));assert.deepEqual(after.map(({template_id,template_change_count,code,...x})=>x),before);await launch();assert.equal((await seen(a.accessToken)).code,'classic');
  });
 }finally{await stop();await client?.end();await control.query(`DROP DATABASE IF EXISTS "${db}" WITH (FORCE)`);await control.end()}
});
