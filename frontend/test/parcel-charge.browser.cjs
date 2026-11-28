// Parcel handoff with a parcel charge, against a real local backend (seeded test database only).
// TEST_URL=http://127.0.0.1:5304 HOTEL_A=1234 PIN_A=111111 PGURL=postgres://postgres@127.0.0.1:55432/knockout_e2e [OUT=dir] node frontend/test/parcel-charge.browser.cjs
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/reemusjanus/Library/Caches/ms-playwright-go/1.57.0/package');
const pg=require(require.resolve('pg',{paths:[__dirname+'/../../backend',__dirname+'/../../node_modules']}));
const E=process.env,U=E.TEST_URL;
(async()=>{const db=new pg.Client(E.PGURL);await db.connect();const q=async(s,v)=>(await db.query(s,v)).rows;
 const browser=await chromium.launch({executablePath:E.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const [menu]=await q('SELECT id,name FROM knockout.menu_items WHERE available ORDER BY id LIMIT 1');await q('UPDATE knockout.menu_items SET price=150 WHERE id=$1',[menu.id]);
  await q("UPDATE knockout.orders SET status='cancelled',cancelled_at=NOW() WHERE guest_name LIKE 'Charge %' AND status<>'completed'");await q("UPDATE knockout.orders SET guest_name='Charge done' WHERE guest_name LIKE 'Charge %'");
  for(const [width,template] of[[1440,'classic'],[390,'glass-dark'],[1024,'royal-gold-glass']]){
   await q("UPDATE knockout_master.companies SET template_id=(SELECT id FROM knockout_master.ui_templates WHERE code=$1) WHERE database_name='knockout'",[template]);
   const login=await (await fetch(U+'/api/public/resolve-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({hotelId:E.HOTEL_A,pin:E.PIN_A})})).json();
   const made=await (await fetch(U+'/api/parcels',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+login.accessToken,'x-portal-role':'admin'},body:JSON.stringify({customerName:`Charge ${width}`,items:[{menuId:menu.id,qty:1}]})})).json();
   await q("UPDATE knockout.orders SET status='ready' WHERE id=$1",[made.id]);
   const p=await browser.newPage({viewport:{width,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(U+'/login');await p.locator('.hotel-id-field input').fill(E.HOTEL_A);await p.locator('.web-otp-input').fill(E.PIN_A);await p.locator('.shell').first().waitFor();
   await p.waitForFunction(t=>(document.documentElement.dataset.template||'classic')===t,template);
   if(width<1100){await p.getByRole('button',{name:'Menu',exact:true}).click();await p.locator('.mobile-navigation-drawer button').filter({hasText:'Parcel Orders'}).first().click()}else await p.locator('aside nav button:visible,.masthead-nav button:visible').filter({hasText:'Parcel Orders'}).first().click();
   const today=await p.locator('.finance-month-grid>button.is-today');if(await today.count())await today.click();
   const card=p.locator('article').filter({hasText:`Charge ${width}`});await card.getByRole('button',{name:'Complete parcel handoff'}).click();
   const modal=p.locator('.modal'),field=modal.getByLabel('Parcel Charge (₹)'),total=()=>modal.locator('.thermal-total b').textContent();
   assert.equal(await field.inputValue(),'0');assert.match(await total(),/150\.00/);assert.equal(await modal.locator('.thermal-totals').getByText('Parcel charge').count(),0,'zero charge omitted');
   await field.fill('-5');assert(await modal.getByRole('button',{name:/Cash received/}).isDisabled());
   await field.fill('20');assert.match(await total(),/170\.00/);await modal.locator('.thermal-totals').getByText('Parcel charge').waitFor();assert.match(await modal.locator('.parcel-handoff-actions .bill-amount').first().textContent(),/170/);
   await field.blur();for(let i=0;i<40&&Number((await q('SELECT parcel_charge FROM knockout.orders WHERE id=$1',[made.id]))[0].parcel_charge)!==20;i++)await p.waitForTimeout(150);
   assert.equal(Number((await q('SELECT parcel_charge FROM knockout.orders WHERE id=$1',[made.id]))[0].parcel_charge),20,'saved before payment');
   if(E.OUT)await modal.screenshot({path:`${E.OUT}/parcel-${width}.png`});
   await modal.getByRole('button',{name:/Cash received/}).click();await p.locator('.toast').filter({hasText:/completed by Cash · ₹170/}).first().waitFor();await p.locator('.modal').first().waitFor({state:'detached'});
   const [row]=await q('SELECT subtotal,parcel_charge,total,status FROM knockout.orders WHERE id=$1',[made.id]);assert.deepEqual([Number(row.subtotal),Number(row.parcel_charge),Number(row.total),row.status],[150,20,170,'completed']);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow');
   await card.getByRole('button',{name:/View \/ print bill/}).click();assert.match(await p.locator('.modal .thermal-total b').textContent(),/170\.00/);assert(await p.locator('.modal').getByLabel('Parcel Charge (₹)').count()===0||await p.locator('.modal').getByLabel('Parcel Charge (₹)').isDisabled(),'locked after payment');
   assert.deepEqual(errors,[]);console.log(`PASS ${width}px ${template}: ₹150 + ₹20 = ₹170 previewed, saved, paid, reprinted; zero omitted; negative blocked`);await p.close();
  }
  await q("UPDATE knockout_master.companies SET template_id=(SELECT id FROM knockout_master.ui_templates WHERE code='classic') WHERE database_name='knockout'");
 }finally{await db.end();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))])}
 process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
