// Superadmin console against a real local backend (seeded test database only).
// TEST_URL=http://127.0.0.1:5304 MASTER_PIN=654321 HOTEL_A=1234 PIN_A=111111 PGURL=postgres://postgres@127.0.0.1:55432/knockout_e2e node frontend/test/superadmin-console.browser.cjs
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/reemusjanus/Library/Caches/ms-playwright-go/1.57.0/package');
const pg=require(require.resolve('pg',{paths:[__dirname+'/../../backend',__dirname+'/../../node_modules']}));
const E=process.env,U=E.TEST_URL,api=async(token,path,method='GET',body)=>{const r=await fetch(U+'/api'+path,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body&&JSON.stringify(body)});return{code:r.status,body:await r.json().catch(()=>null)}};
(async()=>{const db=new pg.Client(E.PGURL);await db.connect();const q=async(s,v)=>(await db.query(s,v)).rows;
 const browser=await chromium.launch({executablePath:E.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const master=(await api(null,'/public/resolve-login','POST',{hotelId:'',pin:E.MASTER_PIN})).body;
  await api(master.accessToken,'/master/appearance','PUT',{templateId:null});
  const open=async(width=1440)=>{const p=await browser.newPage({viewport:{width,height:900}});p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));
   const fresh=(await api(null,'/public/resolve-login','POST',{hotelId:'',pin:E.MASTER_PIN})).body;
   await p.addInitScript(u=>{if(!sessionStorage.getItem('knockout-portal-user')){sessionStorage.setItem('knockout-portal-user',JSON.stringify(u));sessionStorage.setItem('knockout-access-token',u.accessToken)}},fresh);await p.goto(U);await p.getByRole('heading',{name:'Platform overview'}).waitFor();return p};
  const tpl=p=>p.evaluate(()=>document.documentElement.dataset.template||'classic');
  const nav=(p,n)=>p.locator('aside nav button:visible').filter({hasText:n}).first().click();
  const before=await q('SELECT id,template_id,template_change_count FROM knockout_master.companies ORDER BY id');
  const p=await open();

  // KPIs are the database's numbers.
  const [[c]]=[await q("SELECT COUNT(*)::int total,COUNT(*) FILTER (WHERE status='active')::int active,COUNT(*) FILTER (WHERE status='suspended')::int suspended FROM knockout_master.companies")];
  const [[r]]=[await q("SELECT COUNT(*)::int n FROM knockout_master.company_registration_requests WHERE status='pending'")];
  const kpi=async l=>(await p.locator('.console-kpi').filter({has:p.locator('.dash-kpi-head>span',{hasText:new RegExp('^'+l+'$')})}).locator('strong').textContent()).trim();
  assert.equal(await kpi('Total tenants'),String(c.total));assert.equal(await kpi('Active tenants'),String(c.active));assert.equal(await kpi('Suspended'),String(c.suspended));assert.equal(await kpi('Pending registrations'),String(r.n));
  await p.locator('.console-health dd').first().getByText(/Online/).waitFor();assert(await p.locator('.console-chart svg').count()>=2);
  await p.locator('.console-kpi').filter({hasText:'Suspended'}).click();await p.getByRole('heading',{name:'Tenants'}).waitFor();assert.equal(await p.locator('.console-directory tbody tr').count(),c.suspended);
  console.log('PASS dashboard KPIs match the Master DB; KPI opens the filtered directory');

  // Own appearance: unlimited, persistent, tenant-independent.
  await nav(p,'My Appearance');for(const [name,code] of[['Glass Dark','glass-dark'],['Glass Light','glass-light'],['Royal Gold Glass','royal-gold-glass'],['Emerald','emerald'],['Aurora Glass','aurora-glass']]){await p.locator('.template-card').filter({has:p.getByRole('heading',{name:new RegExp('^'+name)})}).getByRole('button',{name:'Use for my console'}).click();await p.waitForFunction(c=>document.documentElement.dataset.template===c,code)}
  await p.reload();await p.getByRole('heading',{name:'My Appearance'}).or(p.getByRole('heading',{name:'Platform overview'})).first().waitFor();assert.equal(await tpl(p),'aurora-glass');
  assert.deepEqual(await q('SELECT id,template_id,template_change_count FROM knockout_master.companies ORDER BY id'),before,'tenants untouched');
  const admin=await browser.newPage();await admin.goto(U);const a=(await api(null,'/public/resolve-login','POST',{hotelId:E.HOTEL_A,pin:E.PIN_A})).body;assert.equal(a.template.code,(await q("SELECT t.code FROM knockout_master.companies c JOIN knockout_master.ui_templates t ON t.id=c.template_id WHERE database_name='knockout'"))[0].code,'Admin still gets the tenant template');await admin.close();
  console.log('PASS Superadmin theme: 5 changes, persists after reload, tenants and allowance unchanged');

  // Search, notifications, tenant actions and audit.
  const name=(await q("SELECT company_name n FROM knockout_master.companies WHERE status='active' AND database_name<>'knockout' ORDER BY id LIMIT 1"))[0].n;
  await p.getByLabel('Search tenants, registrations and screens').fill(name.slice(0,5));await p.locator('.quick-results button').filter({hasText:name}).first().click();await p.getByRole('heading',{name}).waitFor();
  await p.locator('.page-head').getByRole('button',{name:'Suspend'}).click();await p.locator('.confirm-dialog').getByRole('button',{name:'Suspend company'}).click();await p.locator('.page-head').getByRole('button',{name:'Activate'}).waitFor();
  await p.locator('.page-head').getByRole('button',{name:'Activate'}).click();await p.locator('.page-head').getByRole('button',{name:'Suspend'}).waitFor();
  await p.locator('.company-detail-tabs button').filter({hasText:'Activity'}).click();await p.locator('.console-activity').getByText('Tenant suspended').first().waitFor();await p.locator('.console-activity').getByText('Tenant activated').first().waitFor();
  console.log('PASS global search opens tenant; suspend/activate audited in tenant activity');

  // Template assignment from the tenant page, then history.
  const cur=(await q("SELECT t.code FROM knockout_master.companies c JOIN knockout_master.ui_templates t ON t.id=c.template_id WHERE company_name=$1",[name]))[0].code,[target,label]=cur==='midnight-glass'?['aurora-glass','Aurora Glass']:['midnight-glass','Midnight Glass'];
  await p.locator('.page-head').getByRole('button',{name:'Template'}).click();const dlg=p.locator('.modal');await dlg.locator('label').filter({hasText:label}).click();await dlg.getByRole('button',{name:'Assign template'}).click();await dlg.waitFor({state:'detached'});
  assert.equal((await q("SELECT t.code FROM knockout_master.companies c JOIN knockout_master.ui_templates t ON t.id=c.template_id WHERE company_name=$1",[name]))[0].code,target);
  assert.equal((await q("SELECT template_change_count n FROM knockout_master.companies WHERE company_name=$1",[name]))[0].n,0,'Superadmin assignment does not use Admin changes');
  await p.locator('.company-detail-tabs button').filter({hasText:'Templates'}).click();await p.locator('.console-activity').getByText('Template assigned by Superadmin').first().waitFor();
  console.log('PASS template assignment from tenant page; history shows it; allowance untouched');

  // Approval queue: an Admin template request approved from the console.
  await q("UPDATE knockout_master.companies SET template_change_count=3,template_id=(SELECT id FROM knockout_master.ui_templates WHERE code='classic') WHERE database_name='knockout'");await q("UPDATE knockout_master.template_change_requests SET status='rejected',reviewed_at=NOW() WHERE status='pending'");
  const glass=(await q("SELECT id FROM knockout_master.ui_templates WHERE code='glass-light'"))[0].id;
  const asked=await api(a.accessToken,'/appearance/requests','POST',{templateId:Number(glass),reason:'Brighter look for the day team'});assert.equal(asked.code,201,JSON.stringify(asked.body));
  await nav(p,'Approvals');const row=p.locator('.console-requests li').filter({hasText:'Brighter look'});await row.getByRole('button',{name:'Approve'}).click();await p.locator('.confirm-dialog').getByRole('button',{name:'Approve'}).click();await row.waitFor({state:'detached'});
  assert.equal((await q("SELECT t.code FROM knockout_master.companies c JOIN knockout_master.ui_templates t ON t.id=c.template_id WHERE database_name='knockout'"))[0].code,'glass-light');
  await p.getByRole('button',{name:'Decided'}).click();await p.locator('.console-requests li').filter({hasText:'Brighter look'}).getByText('approved',{exact:true}).first().waitFor();
  console.log('PASS approval queue approves an Admin template request');

  // Phone: drawer navigation and notification centre.
  const m=await open(390);await m.getByRole('button',{name:'Menu',exact:true}).click();await m.locator('.mobile-navigation-drawer').getByRole('button',{name:/Tenants/}).first().click();await m.getByRole('heading',{name:'Tenants'}).waitFor();
  await m.locator('.mobile-header-account .notice-centre>button').click();await m.locator('.notice-panel').waitFor();assert(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  console.log('PASS phone navigation, notifications, no overflow');
  assert.deepEqual([...p.errors,...m.errors],[]);
  await q("UPDATE knockout_master.companies SET template_change_count=0");await api(master.accessToken,'/master/appearance','PUT',{templateId:null});
 }finally{await db.end();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))])}
 process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
