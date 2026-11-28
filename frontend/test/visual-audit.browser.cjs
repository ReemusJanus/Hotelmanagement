// Visual + accessibility sweep of every portal screen using synthetic API responses (no live data).
// TEST_URL=http://127.0.0.1:5214 OUT=/tmp/shots WIDTHS=390,1440 [ONLY=admin] node frontend/test/visual-audit.browser.cjs
const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/reemusjanus/Library/Caches/ms-playwright-go/1.57.0/package');
const URL_=process.env.TEST_URL||'http://127.0.0.1:5214',OUT=process.env.OUT,ONLY=process.env.ONLY,TEMPLATE=process.env.TEMPLATE||'classic';
const widths=(process.env.WIDTHS||'360,390,430,768,1024,1440,1920').split(',').map(Number);
const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function fixture(base){
 const now=Date.now(),ago=m=>new Date(now-m*60000).toISOString(),today=key(new Date());
 const s=structuredClone(base);s.settings={...s.settings,hotelName:'Harbour House',timezone:'Asia/Kolkata'};s.companyDatabase='tenant_test';
 s.menu.push({id:13,name:'Watermelon Cooler',category:'Juices',price:180,icon:'🍉',available:true},{id:14,name:'Fresh Lime Soda',category:'Juices',price:120,icon:'🍋',available:false},{id:15,name:'Family Feast',category:'Combos',price:1490,icon:'🍱',available:true,isCombo:true,components:[{menuId:4,quantity:2,name:'Herb Roasted Chicken'},{menuId:12,quantity:6,name:'Butter Naan'}]});
 s.menu.forEach(m=>m.components||=[]);
 const line=(menuId,qty,itemStatus='new',note='',handoffStatus='pending')=>({menuId,qty,itemStatus,note,handoffStatus,batchNo:1,price:s.menu.find(m=>m.id===menuId).price});
 s.orders=[
  {id:1001,tableId:4,guestName:'Walk-in Guest',guestCount:2,waiter:'Ravi',status:'preparing',createdAt:ago(26),items:[line(3,2,'preparing','Medium spicy'),line(7,1,'new'),line(12,4,'ready'),line(13,2,'preparing')],paymentStatus:'unpaid'},
  {id:1002,tableId:9,guestName:'Meera Nair',guestCount:3,waiter:'Priya',status:'ready',createdAt:ago(31),items:[line(2,1,'ready'),line(5,2,'ready','No garlic')],paymentStatus:'unpaid'},
  {id:1003,tableId:12,guestName:'Rahul Jain',guestCount:2,waiter:'Ravi',status:'new',createdAt:ago(8),items:[line(1,2),line(4,2),line(13,1)],paymentStatus:'unpaid'},
  {id:1004,tableId:6,guestName:'Sana Khan',guestCount:4,waiter:'Ravi',status:'billing_requested',createdAt:ago(64),items:[line(6,2,'ready','','received'),line(12,4,'ready','','received')],paymentStatus:'unpaid'},
  {id:1005,orderType:'parcel',guestName:'Dev Patel',customerPhone:'9876543210',waiter:'Admin',status:'new',createdAt:ago(12),items:[line(4,1),line(13,2)],paymentStatus:'unpaid',dailyNumber:5},
  {id:1006,orderType:'parcel',guestName:'Anita Rao',customerPhone:'9876500000',waiter:'Admin',status:'ready',createdAt:ago(40),items:[line(7,2,'ready')],paymentStatus:'paid',paymentMethod:'upi',total:1092,dailyNumber:4},
  {id:990,tableId:2,guestName:'Karan Shah',waiter:'Ravi',status:'completed',createdAt:ago(170),completedAt:ago(110),items:[line(4,2,'ready','','received')],paymentStatus:'paid',paymentMethod:'card',subtotal:1360,tax:68,serviceCharge:0,total:1428,billNumber:12,billDate:today},
  {id:991,tableId:1,guestName:'Ishaan',waiter:'Priya',status:'completed',createdAt:ago(210),completedAt:ago(150),items:[line(5,1,'ready','','received'),line(13,1,'ready','','received')],paymentStatus:'paid',paymentMethod:'cash',subtotal:750,tax:38,serviceCharge:0,total:788,billNumber:13,billDate:today}];
 Object.assign(s.tables[5],{status:'occupied',orderId:1004,guestName:'Sana Khan'});s.tables[10].status='cleaning';
 s.orders.forEach(o=>o.cancellations=[]);
 s.bookings=[{id:1,tableId:3,tableNumber:3,seats:4,area:'Main Hall',guestName:'Ananya Rao',guestCount:4,customerPhone:'9876501234',bookingDate:today,bookingTime:'20:00',durationMinutes:90,status:'confirmed',notificationStatus:'sent'},{id:2,tableId:8,tableNumber:8,seats:4,area:'Main Hall',guestName:'Karan Shah',guestCount:2,customerPhone:'9876504321',bookingDate:today,bookingTime:'20:30',durationMinutes:60,status:'confirmed',notificationStatus:'queued'}];
 s.users=[{id:1,name:'Arjun Kumar',role:'admin',pin:'123456',phone:'9876543210',payType:'monthly',payRate:60000,active:true,approvalStatus:'approved',createdAt:ago(9e4)},{id:2,name:'Ravi Sharma',role:'waiter',pin:'111111',phone:'9876543211',payType:'daily',payRate:900,active:true,approvalStatus:'approved',createdAt:ago(9e4)},{id:3,name:'Kabir Singh',role:'chef',pin:'222222',phone:'',payType:'monthly',payRate:45000,active:true,approvalStatus:'approved',createdAt:ago(9e4)},{id:4,name:'Lena Dsouza',role:'juicer',pin:'333333',phone:'',payType:'hourly',payRate:120,active:false,approvalStatus:'approved',createdAt:ago(9e4)}];
 s.attendance=[{id:1,userId:2,checkIn:ago(200),checkOut:null,name:'Ravi Sharma',role:'waiter'},{id:2,userId:3,checkIn:ago(500),checkOut:ago(30),name:'Kabir Singh',role:'chef'}];
 s.kitchenStaff=[{id:1,name:'Nikhil Das',designation:'Sous Chef',phone:'9876511111',specialization:'Tandoor',payType:'monthly',payRate:32000,joinedOn:'2026-01-04',userId:null,notes:'',active:true,approvalStatus:'approved'}];
 s.staffRequests=[{id:9,name:'Om Iyer',designation:'Commis',requestedBy:3,requestedByName:'Kabir Singh',approvalStatus:'pending',payType:'daily',payRate:700,createdAt:ago(90)}];
 s.inventoryTransactions=[{id:1,inventoryId:1,movementType:'in',quantity:20,unitCost:110,note:'Weekly delivery',createdBy:'Arjun',createdAt:ago(300)},{id:2,inventoryId:2,movementType:'out',quantity:4,unitCost:310,note:'Kitchen',createdBy:'Arjun',createdAt:ago(120)}];
 s.stockRequests=[{id:1,inventoryId:2,itemName:'Chicken Breast',category:'Meat',currentQuantity:8,unit:'kg',minQuantity:12,requestedQuantity:16,note:'Weekend service',requestedBy:'Kabir',status:'pending',createdAt:ago(50)}];
 s.financeEntries=[{id:1,entryType:'expense',category:'Utilities',description:'Electricity bill',amount:420,paymentMethod:'upi',entryDate:today,reference:'EB-21',createdBy:'Arjun'},{id:2,entryType:'income',category:'Events',description:'Hall deposit',amount:1500,paymentMethod:'cash',entryDate:today,reference:'',createdBy:'Arjun'}];
 s.supplierPurchases=[{id:1,supplierName:'Coastal Fresh',invoiceNumber:'CF-118',description:'Fish and prawns',purchaseDate:today,totalAmount:5200,notes:''}];
 s.supplierPayments=[{id:1,purchaseId:1,amount:2200,paymentMethod:'upi',paymentDate:today,reference:'U1',notes:''}];
 s.dashboard={todayRevenue:2216,growthKind:'percent',growthPercent:12.4,occupiedTables:4,totalTables:18,activeOrders:6,lowStock:3,occupancyPercent:22,timezone:'Asia/Kolkata',revenueDays:[12400,9800,15200,13100,18900,21400,2216].map((revenue,i)=>({date:key(new Date(now-(6-i)*864e5)),revenue}))};
 return s;
}
const templates={templates:['Classic','Luxury','Modern','Minimal','Royal','Midnight Dark','Ocean Dark','Emerald','AMOLED','Modern Light','Glass Light','Glass Dark','Midnight Glass','Royal Gold Glass','Aurora Glass'].map((name,i)=>({id:i+1,code:name.toLowerCase().replaceAll(' ','-'),name,version:'1.0.0',active:true,companyCount:i?0:2,preview:{description:name+' description for this template.',layout:['sidebar','masthead','floating','text','rail','sidebar','rail','masthead','text','split'][i],colors:['#151719','#C5A572','#F8F7F4']}})),assignments:[{companyId:1,companyName:'Harbour House',hotelId:'1001',status:'active',templateId:1,changeCount:2},{companyId:2,companyName:'Terrace Nine',hotelId:'1002',status:'suspended',templateId:1,changeCount:0}],history:[{id:1,companyName:'Harbour House',previousName:'Luxury',templateName:'Classic',templateVersion:'1.0.0',assignedBy:'Master',source:'admin',createdAt:new Date().toISOString()}],changeLimit:3,requests:[{id:1,companyName:'Harbour House',currentName:'Classic',templateId:5,templateCode:'royal',templateName:'Royal',reason:'We are rebranding the restaurant',status:'pending',requestedBy:'Arjun Kumar',createdAt:new Date().toISOString()}]};
const appearance={templates:templates.templates,currentTemplateId:1,changeLimit:3,changesUsed:3,remaining:0,requests:[{...templates.requests[0],status:'rejected',reviewNote:'Keep the current brand'}]};
const master=()=>({appearance:TEMPLATE==='classic'?null:{id:2,code:TEMPLATE,version:'1.0.0'},pendingTemplateRequests:1,companies:[{id:1,createdAt:new Date(Date.now()-40*864e5).toISOString(),templateId:1,templateCode:'classic',templateName:'Classic',templateChangesUsed:1,email:'ops@harbour.example',phone:'9876500000',companyName:'Harbour House',databaseName:'tenant_harbour',cyDb:'CY-1',hotelId:'1001',adminName:'Arjun Kumar',adminLoginActive:true,staffCount:12,status:'active',online:true,activeOrders:6,lowStock:3,revenue:482000,dailyRevenue:[3,2,1,0].map(d=>({date:key(new Date(Date.now()-d*864e5)),total:12000+d*3100})),users:[{id:1,name:'Arjun Kumar',role:'admin',active:true}],modules:{tables:true,kitchen:true,juicer:true,finance:false}},{id:2,createdAt:new Date(Date.now()-5*864e5).toISOString(),templateId:12,templateCode:'glass-dark',templateName:'Glass Dark',templateChangesUsed:0,companyName:'Terrace Nine',databaseName:'tenant_terrace',hotelId:'1002',adminName:'Maya Iyer',adminLoginActive:true,staffCount:5,status:'suspended',online:false,activeOrders:0,lowStock:0,revenue:91000,dailyRevenue:[],users:[],modules:{}}],invoices:[{id:1,companyId:1,companyName:'Harbour House',billingMonth:new Date().toISOString().slice(0,7),total:4999,subtotal:4236,tax:763,status:'due',lines:[],items:[]}],usage:[{companyId:1,uniqueUsers:9,totalLogins:240}],subscriptions:[{companyId:1,packageCode:'professional',status:'active',expiresAt:'2027-03-01'}],registrationRequests:[{id:7,companyName:'Saffron Court',adminName:'Neel Shah',email:'neel@example.com',phone:'9876500001',status:'pending',packageCode:'starter',periodMonths:1,createdAt:new Date().toISOString()},{id:6,companyName:'Blue Door',adminName:'Anu',email:'anu@example.com',phone:'9876500002',status:'rejected',packageCode:'starter',periodMonths:3,createdAt:new Date(Date.now()-9*864e5).toISOString()}]});
const consoleFixture={health:{checkedAt:new Date().toISOString(),database:{ok:true,latencyMs:1.4},realtime:{provider:'memory',ready:false},uptimeSeconds:93784,memoryMb:142,heapMb:61,node:'v26.0.0',notifications:{queued:0,failedLastDay:1}},activity:{events:[{key:'a1',companyId:1,companyName:'Harbour House',action:'company.suspended',detail:'',actor:'Master Administrator',createdAt:new Date(Date.now()-36e5).toISOString()},{key:'a2',companyId:1,companyName:'Harbour House',action:'template.superadmin',detail:'Classic → Glass Dark',actor:'Master Administrator',createdAt:new Date(Date.now()-864e5).toISOString()},{key:'a3',companyId:null,companyName:'Saffron Court',action:'registration.submitted',detail:'starter · 1 months',actor:'Neel Shah',createdAt:new Date().toISOString()}]}};
const click=(sel,n=0)=>async p=>{const l=p.locator(sel).nth(n);await l.waitFor({timeout:4000});await l.click()};
const roles={
 admin:['Tables','Table Bookings','Orders & Billing','Parcel Orders','Food & Photos','Stock Management','Finance Management','Staff','Settings'],
 waiter:['Tables','My Orders'],chef:['Chef Management','Book Kitchen Stock','Dishes','Table Orders','Parcel Queue','Ready to Serve','Preparation History'],
 juicer:['Juices','Table Orders','Parcel Queue','Ready Juices','Preparation History'],superadmin:['Tenants','Approvals','SaaS Billing','Tenant Templates','My Appearance','Harbour House']};
const extra={
 'admin/Tables':[['detail',click('.table-card-main',3)],['edit',click('.table-card-actions button')]],
 'admin/Table Bookings':[['new',click('.page-head .primary')],['day',click('.finance-month-grid .is-today')]],
 'admin/Orders & Billing':[['day',click('.finance-month-grid .is-today')]],
 'admin/Parcel Orders':[['calendar',click('.page-head .secondary')],['new',click('.page-head .primary')]],
 'admin/Food & Photos':[['new',click('.page-head .primary')]],
 'admin/Stock Management':[['new',click('.page-head .primary')]],
 'admin/Finance Management':[['day',click('.finance-month-grid .is-today')]],
 'admin/Settings':[['appearance',click('.settings-tabs button',1)]],
 'admin/Staff':[['new',click('.page-head .primary')]],
 'admin/Overview':[['notices',async p=>{await p.locator('.notice-centre>button:visible').first().click()}],['profile',async p=>{const a=p.locator('.header-profile:visible,.mobile-header-name:visible').first();await a.click()}]],
 'waiter/Tables':[['occupied',click('.table-card-main',3)],['free',click('.table-card-main',0)],['builder',async p=>{await p.locator('.table-card-main').nth(3).click();await p.locator('.drawer-tabs button').nth(1).click()}]],
 'chef/Table Orders':[['ticket',click('.kitchen-grid .chef-order-summary, .kitchen-grid .kds-open')]],
 'chef/Chef Management':[['new',click('.page-head .primary')]],
 'chef/Book Kitchen Stock':[['request',click('.chef-stock-grid .primary')]],
 'juicer/Table Orders':[['ticket',click('.kitchen-grid .chef-order-summary, .kitchen-grid .kds-open')]],
 'superadmin/Tenant Templates':[['change',click('.data-table .secondary')]],
 'superadmin/Tenants':[['assign',click('.console-row-actions .secondary',1)]],
 'superadmin/Harbour House':[['users',click('.company-detail-tabs button',1)],['controls',click('.company-detail-tabs button',2)],['templates',click('.company-detail-tabs button',3)],['activity',click('.company-detail-tabs button',4)],['billing',click('.company-detail-tabs button',5)]],
};
// Runs in page: overflow, text contrast (<4.5 or <3 large), and small touch targets.
const inspect=mobile=>{
 const cv=document.createElement('canvas');cv.width=cv.height=1;const cx=cv.getContext('2d',{willReadFrequently:true});
 const parse=c=>{cx.clearRect(0,0,1,1);cx.fillStyle=c;cx.fillRect(0,0,1,1);const d=cx.getImageData(0,0,1,1).data;return[d[0],d[1],d[2],d[3]/255]};
 const over=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3])).concat(1);
 const bg=el=>{const st=[];for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);if(s.backgroundImage.includes('url('))return null;const c=parse(s.backgroundColor);const g=s.backgroundImage.match(/(?:rgba?|color|oklab)\([^)]*\)|#[0-9a-f]{3,8}/i);if(g){const gc=parse(g[0]);if(gc[3]>.5)st.push(gc)}st.push(c);if(c[3]>.99)break}return st.reverse().reduce((a,c)=>over(c,a),[255,255,255,1])};
 const lum=c=>{const f=c.slice(0,3).map(v=>(v/=255)<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*f[0]+.7152*f[1]+.0722*f[2]};
 const scope=[...document.querySelectorAll('.modal')].at(-1)||document.body,low={},small={},tiny={};
 const cls=e=>{const n=x=>x.tagName.toLowerCase()+(typeof x.className==='string'&&x.className?'.'+x.className.trim().split(/\s+/).slice(0,2).join('.'):'');return (e.parentElement?n(e.parentElement)+'>':'')+n(e)};
 const w=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
 while(w.nextNode()){const t=w.currentNode;if(!t.textContent.trim())continue;const e=t.parentElement,r=e.getBoundingClientRect();if(!r.width||!r.height||e.closest('.thermal-receipt,script,style,option,:disabled,[inert]'))continue;const s=getComputedStyle(e);if(s.visibility==='hidden'||+s.opacity<.2||parseFloat(s.fontSize)<2||s.textIndent.startsWith('-'))continue;if(parseFloat(s.fontSize)<11.5&&!e.closest('.lux-site'))tiny[cls(e)]=s.fontSize+' "'+t.textContent.trim().slice(0,18)+'"';const b=bg(e);if(!b)continue;const fg=over(parse(s.color),b),L=[lum(fg),lum(b)].sort((x,y)=>y-x),c=(L[0]+.05)/(L[1]+.05),big=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.6&&+s.fontWeight>=700);if(c<(big?3:4.5)&&!/^\p{Extended_Pictographic}/u.test(t.textContent.trim()))low[cls(e)]=c.toFixed(1)+' '+s.color+' on '+b.slice(0,3).map(Math.round)+' "'+t.textContent.trim().slice(0,18)+'"'}
 if(mobile)for(const e of scope.querySelectorAll('button,select,a[href],input:not([type=checkbox]):not([type=radio]):not([type=file])')){const r=e.getBoundingClientRect();if(r.width&&r.height&&(r.height<43.5||r.width<43.5)&&!e.closest('.thermal-receipt,.web-otp-grid,.search-field,.table-search,.global-search,.lux-site'))small[cls(e)]=Math.round(r.width)+'x'+Math.round(r.height)}
 const over_=document.documentElement.scrollWidth>innerWidth+1?[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,5).map(cls):null;
 const tb=document.querySelector('.mobile-tabbar'),tr=tb?.getBoundingClientRect();const badBar=tb&&!document.querySelector('.modal')&&(mobile?(tr.height>110||innerHeight-tr.bottom>14||(tr.width<Math.min(innerWidth-30,600)||Math.abs(tr.left+tr.right-innerWidth)>4)):tr.height>0);
 const m=document.querySelector('.modal');const mo=m&&m.scrollWidth>m.clientWidth+2?[...m.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>m.getBoundingClientRect().right+1).slice(0,4).map(cls):null;
 return{low,small,tiny,over:badBar?['tab bar layout '+tr.height]:over_,modalOver:mo};
};
(async()=>{
 const {initialData}=await import(pathToFileURL(path.resolve(__dirname,'../../backend/src/store.js')));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const agg={low:{},small:{},tiny:{},over:[],errors:[]};let n=0;
 if(OUT)fs.mkdirSync(OUT,{recursive:true});
 const record=async(p,name,width,errors)=>{await p.waitForTimeout(260);n++;const r=await p.evaluate(inspect,width<1100);for(const[k,v]of Object.entries(r.low))agg.low[k]=v+'  ['+name+']';for(const[k,v]of Object.entries(r.small))agg.small[k]=v+'  ['+name+']';for(const[k,v]of Object.entries(r.tiny))agg.tiny[k]=v+'  ['+name+']';if(r.over)agg.over.push(`${width} ${name} ${r.over.join(' | ')}`);if(r.modalOver)agg.over.push(`${width} ${name} MODAL ${r.modalOver.join(' | ')}`);if(errors.length)agg.errors.push(`${width} ${name} ${errors.splice(0)}`);if(OUT)await p.screenshot({path:`${OUT}/${width}-${name.replace(/[^a-z0-9]+/gi,'_')}.png`,fullPage:!!process.env.FULL&&!(await p.locator('.modal').count())})};
 for(const width of widths){const height=width<600?844:width<1100?1100:900;
  for(const role of[...Object.keys(roles),'public']){if(ONLY&&!ONLY.split(',').includes(role))continue;
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1100,reducedMotion:'reduce'}),errors=[];
   const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errors.push(e.message));
   if(role==='public'){for(const r of['/','/login','/register']){await p.goto(URL_+r,{waitUntil:'domcontentloaded'});await p.waitForTimeout(500);await record(p,'public'+r,width,errors)}await ctx.close();continue}
   const name={admin:'Arjun Kumar',waiter:'Ravi Sharma',chef:'Kabir Singh',juicer:'Lena Dsouza',superadmin:'Master Administrator'}[role];
   await p.addInitScript(([role,name,tpl])=>{sessionStorage.setItem('knockout-portal-user',JSON.stringify({id:1,name,role,companyName:'Harbour House',companyDatabase:'tenant_test',modules:{},template:{id:1,code:tpl,version:'1.0.0'}}));sessionStorage.setItem('knockout-access-token','fixture');window.WebSocket=class{close(){}}},[role,name,TEMPLATE]);
   const state=role==='superadmin'?master():fixture(initialData);
   await p.route('**/api/**',r=>r.fulfill({json:/state$/.test(new URL(r.request().url()).pathname)?state:/profile$/.test(r.request().url())?{id:1,name,role,phone:'',email:''}:/session$/.test(r.request().url())?{modules:{},template:{id:1,code:TEMPLATE,version:'1.0.0'}}:/master\/health$/.test(new URL(r.request().url()).pathname)?consoleFixture.health:/master\/activity$/.test(new URL(r.request().url()).pathname)?consoleFixture.activity:/master\/appearance$/.test(new URL(r.request().url()).pathname)?{templates:templates.templates,current:state.appearance||null}:/appearance$/.test(r.request().url())?appearance:/ui-templates$/.test(r.request().url())?templates:{modules:{},id:1}}));
   for(const pg of['Overview',...roles[role]]){const open=async()=>{await p.goto(URL_,{waitUntil:'domcontentloaded'});await p.locator('.shell,.master-shell').waitFor();if(pg==='Overview')return;
     if(width<1100)await p.locator('.responsive-menu-toggle').click();await p.locator(width<1100?'.mobile-navigation-drawer nav button':'aside nav button:visible,.masthead-nav button:visible').filter({hasText:pg}).first().click();if(width<1100)await p.locator('.mobile-navigation-drawer').waitFor({state:'detached'})};
    try{await open();await record(p,`${role}/${pg}`,width,errors);
     for(const[label,fn]of extra[`${role}/${pg}`]||[]){await open();try{await fn(p);await record(p,`${role}/${pg}/${label}`,width,errors)}catch(e){agg.errors.push(`${width} ${role}/${pg}/${label}: ${e.message.split('\n')[0]}`)}}
    }catch(e){agg.errors.push(`${width} ${role}/${pg}: ${e.message.split('\n')[0]} ${errors.splice(0)}`)}
   }await ctx.close();
  }}
 await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);
 for(const k of['low','small','tiny'])console.log(`\n${{low:'LOW CONTRAST',small:'SMALL TARGETS',tiny:'TINY TEXT'}[k]} ${Object.keys(agg[k]).length}\n`+Object.entries(agg[k]).map(([a,b])=>`${b}  ${a}`).join('\n'));
 console.log('\nOVERFLOW',agg.over.length,'\n'+agg.over.join('\n'));console.log('\nERRORS',agg.errors.length,'\n'+agg.errors.join('\n'));console.log(`\n${n} screens checked`);
 process.exit(agg.over.length||agg.errors.length||(process.env.STRICT&&Object.keys(agg.low).length)?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
