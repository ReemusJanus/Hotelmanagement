// Fewer-taps service flow, end to end against a real local backend (seeded test database only).
// TEST_URL=http://127.0.0.1:5304 HOTEL=1234 PIN_ADMIN=111111 PIN_WAITER=111112 PIN_CHEF=111113 PGURL=postgres://postgres@127.0.0.1:55432/knockout_e2e [OUT=dir] node frontend/test/fewer-taps.browser.cjs
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/reemusjanus/Library/Caches/ms-playwright-go/1.57.0/package');
const pg=require(require.resolve('pg',{paths:[__dirname+'/../../backend',__dirname+'/../../node_modules']}));
const E=process.env,U=E.TEST_URL,S='knockout';
const pad=n=>String(n).padStart(2,'0'),hhmm=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`,ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
(async()=>{const db=new pg.Client(E.PGURL);await db.connect();const q=async(s,v)=>(await db.query(s,v)).rows;
 const browser=await chromium.launch({executablePath:E.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const taps={};
 async function reset(){
  await q(`UPDATE ${S}.orders SET status='cancelled',cancelled_at=NOW() WHERE (guest_name LIKE 'Tap %' OR guest_name LIKE 'Parcel #%' OR table_id IN (2,5,6)) AND status NOT IN ('completed','cancelled')`);
  await q(`UPDATE ${S}.bookings SET status='cancelled' WHERE guest_name LIKE 'Tap %' AND status IN ('confirmed','seated')`);
  await q(`UPDATE ${S}.restaurant_tables SET status='available',order_id=NULL,active_booking_id=NULL,guest_name='',booking_time='' WHERE id IN (2,5,6)`);
  await q(`UPDATE ${S}.settings SET reservation_early_minutes=15 WHERE id=1`);
 }
 async function session(pin,width){
  const ctx=await browser.newContext({viewport:{width,height:width<500?844:900}}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(U+'/login',{waitUntil:'domcontentloaded'});await page.locator('.hotel-id-field input').fill(E.HOTEL);await page.keyboard.press('Tab');await page.keyboard.type(pin);
  await page.locator('.shell').first().waitFor({timeout:20000});
  let n=0;const tap=async(loc)=>{n++;await loc.click()};
  return {page,ctx,errors,tap,count:()=>n,resetCount:()=>{n=0}};
 }
 const noOverflow=async(page,label)=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: horizontal overflow`);
 const toast=async(page,re)=>page.locator('.toast').filter({hasText:re}).first().waitFor({timeout:15000});
 const modal=page=>page.locator('.modal').last();
 const navTo=async(s,name)=>{const p=s.page,drawer=p.locator('.mobile-navigation-drawer');const direct=p.locator('.bottom-nav,.mobile-tabbar,nav').getByRole('button',{name,exact:true}).first();
  if(await p.getByRole('button',{name:'Menu',exact:true}).isVisible().catch(()=>false)&&!(await direct.isVisible().catch(()=>false))){await s.tap(p.getByRole('button',{name:'Menu',exact:true}));await s.tap(drawer.getByRole('button',{name,exact:true}).first());return}
  await s.tap(p.getByRole('button',{name,exact:true}).first())};
 async function chefAdvance(width,queue,id,steps){
  const c=await session(E.PIN_CHEF,width);await c.tap(c.page.getByRole('button',{name:queue}));
  for(const step of steps){const b=c.page.getByRole('button',{name:new RegExp(`${step}: order ${id} round`)}).first();await b.waitFor({timeout:15000});await c.tap(b);await c.page.waitForTimeout(400)}
  assert.deepEqual(c.errors,[]);await c.ctx.close();
 }
 try{
  const [menu]=await q(`SELECT id,name FROM ${S}.menu_items WHERE available AND NOT COALESCE(is_combo,false) ORDER BY id LIMIT 1`);await q(`UPDATE ${S}.menu_items SET price=150 WHERE id=$1`,[menu.id]);
  for(const [width,template] of [[390,'glass-dark'],[1440,'classic'],[1024,'royal-gold-glass']]){
   await reset();
   await q("UPDATE knockout_master.companies SET template_id=(SELECT id FROM knockout_master.ui_templates WHERE code=$1) WHERE database_name='knockout'",[template]);
   const L=`${template}@${width}`;

   // 1–6: walk-in dine-in, waiter side.
   const w=await session(E.PIN_WAITER,width),p=w.page;
   await w.tap(p.getByRole('button',{name:/^Table 2, available/}));
   await modal(p).getByRole('group',{name:'Number of guests'}).waitFor();
   await w.tap(modal(p).getByRole('button',{name:'2 guests',exact:true}));
   const search=modal(p).getByPlaceholder('Search menu items…');await search.waitFor();
   const top=(await search.boundingBox()).y;assert(top<420,`${L}: menu starts at ${top}px, expected near the top`);
   assert.equal(await modal(p).getByRole('button',{name:'Cancel empty group'}).isVisible(),false,`${L}: cancel should sit under More options`);
   assert.equal(await modal(p).getByText('+ New Round').count(),0,`${L}: no round picker on a first order`);
   await w.tap(modal(p).getByRole('button',{name:`Add ${menu.name}`}));await w.tap(modal(p).getByRole('button',{name:`Add ${menu.name}`}));
   await w.tap(modal(p).getByRole('button',{name:/^(Submit this order|Send to kitchen)/}).filter({visible:true}).first());
   await toast(p,/sent to kitchen/);await p.locator('.modal').first().waitFor({state:'detached',timeout:10000});
   const [order]=await q(`SELECT id,guest_count,status FROM ${S}.orders WHERE table_id=2 AND status NOT IN ('completed','cancelled') ORDER BY id DESC LIMIT 1`);
   assert.equal(order.guest_count,2);const [{qty}]=await q(`SELECT SUM(quantity)::int qty FROM ${S}.order_items WHERE order_id=$1`,[order.id]);assert.equal(qty,2);
   taps[`${L} walk-in order`]=w.count();
   await chefAdvance(width,'Open table orders',order.id,['Start preparing','Mark ready','Mark collected']);
   await p.waitForTimeout(1500);w.resetCount();
   if(!(await p.locator('.table-card').first().isVisible().catch(()=>false)))await navTo(w,'Tables');
   const card=p.locator('.table-card').filter({hasText:'T02'});
   await w.tap(card.getByRole('button',{name:'Delivered',exact:true}));await toast(p,/Order delivered to Table 2/);
   assert.equal((await q(`SELECT status FROM ${S}.orders WHERE id=$1`,[order.id]))[0].status==='billing_requested',false,'delivery alone never requests the bill');
   assert.equal(await card.getByRole('button',{name:'Delivered',exact:true}).count(),0);
   await w.tap(card.getByRole('button',{name:'Request bill',exact:true}));await toast(p,/sent to Admin/);
   const [billed]=await q(`SELECT status FROM ${S}.orders WHERE id=$1`,[order.id]);assert.equal(billed.status,'billing_requested');
   const [{pending}]=await q(`SELECT COUNT(*)::int pending FROM ${S}.order_items WHERE order_id=$1 AND handoff_status<>'received'`,[order.id]);assert.equal(pending,0,'delivery confirmed before billing');
   taps[`${L} delivered, then request bill`]=w.count();
   await noOverflow(p,L);assert.deepEqual(w.errors,[]);

   // 16: admin pays straight from the dashboard alert.
   const a=await session(E.PIN_ADMIN,width),ap=a.page;
   await a.tap(ap.getByRole('button',{name:/waiting to pay/}));
   const split=template!=='classic';
   if(split){const m=modal(ap);await a.tap(m.getByRole('button',{name:/Split payment/}));await m.getByLabel('Cash amount').fill('200');assert.equal(await m.getByLabel('Card / UPI amount').inputValue(),'100');
    await noOverflow(ap,L+' split');await a.tap(m.getByRole('button',{name:'Record Cash ₹200 + Card / UPI ₹100'}));await toast(ap,/completed by Cash ₹200 \+ Card \/ UPI ₹100/)}
   else{await a.tap(modal(ap).getByRole('button',{name:/Cash Record cash payment/}));await toast(ap,/Cash|paid|completed/i)}
   const [paid]=await q(`SELECT status,payment_status,payment_method,payment_split,total::float total,bill_number FROM ${S}.orders WHERE id=$1`,[order.id]);
   assert.equal(paid.payment_status,'paid');if(split){assert.equal(paid.payment_method,'Split');assert.deepEqual(paid.payment_split,[{method:'Cash',amount:200},{method:'Card / UPI',amount:100}])}assert.equal(paid.total,300);assert(paid.bill_number);
   taps[`${L} admin payment`]=a.count();

   // After the last group pays, the table waits in Cleaning until staff mark it clean.
   assert.equal((await q(`SELECT status FROM ${S}.restaurant_tables WHERE id=2`))[0].status,'cleaning');
   const dirty=p.locator('.table-card').filter({hasText:'T02'});await dirty.getByText('Being cleaned').waitFor({timeout:15000});
   w.resetCount();await w.tap(dirty.getByRole('button',{name:'Mark clean'}));await toast(p,/Table 2 cleaned · ready for guests/);
   await dirty.getByText('Ready for guests').waitFor();assert.equal((await q(`SELECT status FROM ${S}.restaurant_tables WHERE id=2`))[0].status,'available');
   taps[`${L} mark table clean`]=w.count();
   // 18 + empty-group cancellation fix.
   w.resetCount();await w.tap(p.locator('.table-card').filter({hasText:'T02'}).locator('.table-card-main'));
   await w.tap(modal(p).getByRole('button',{name:'1 guest',exact:true}));await modal(p).getByPlaceholder('Search menu items…').waitFor();
   await p.keyboard.press('Escape');await p.keyboard.press('Escape');await p.locator('.modal').first().waitFor({state:'detached',timeout:5000}).catch(()=>{});
   const emptyCard=p.locator('.table-card').filter({hasText:'T02'});await emptyCard.getByText('No items yet').waitFor();
   assert.equal(await emptyCard.getByText('Live preparation').count(),0);
   await w.tap(emptyCard.locator('.table-card-main'));await w.tap(modal(p).locator('summary',{hasText:'More options'}));
   await w.tap(modal(p).getByRole('button',{name:'Cancel empty group'}));await w.tap(modal(p).getByRole('button',{name:'Confirm cancellation'}));
   await toast(p,/Group #\d+ cancelled/);await p.locator('.modal').first().waitFor({state:'detached',timeout:5000});
   await p.locator('.table-card').filter({hasText:'T02'}).getByText('Ready for guests').waitFor({timeout:5000});

   // 9 + 10: booking form chips, occupied-now and capacity validation, upcoming display.
   await navTo(a,'Table Bookings');await a.tap(ap.getByRole('button',{name:'Add booking'}));
   const f=modal(ap),soon=new Date(Date.now()+20*60000);
   await f.getByLabel('Customer name').fill('Tap Booking Later');await f.getByLabel('Customer mobile number').fill('+919000000001');
   await f.getByLabel('Booking time').fill(hhmm(soon));await f.getByRole('button',{name:'3 guests',exact:true}).click();
   assert(await f.getByRole('button',{name:/^T04/}).isDisabled(),'occupied table blocked for a booking within the hour');
   assert(await f.getByRole('button',{name:/^T01/}).isDisabled(),'2-seat table blocked for 3 guests');
   const later=new Date(Date.now()+120*60000);await f.getByLabel('Booking time').fill(hhmm(later));
   if(ymd(later)===ymd(new Date())){
    assert.equal(await f.getByRole('button',{name:/^T04/}).isDisabled(),false,'occupied table can be booked later');
    await f.getByRole('button',{name:'2 guests',exact:true}).click();await f.getByRole('button',{name:/^T02/}).click();await f.getByRole('button',{name:/Confirm booking/}).click();await toast(ap,/Booking confirmed/);
    await navTo(w,'Tables');const up=p.locator('.table-card').filter({hasText:'T02'});await up.getByText(/Booked .* Tap Booking Later/).waitFor({timeout:10000});await up.getByText('Ready for guests').waitFor();
   }else await ap.keyboard.press('Escape');
   const api=async(pin,path,body)=>{const l=await(await fetch(U+'/api/public/resolve-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({hotelId:E.HOTEL,pin})})).json();const r=await fetch(U+'/api'+path,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${l.accessToken}`,'x-company-database':l.companyDatabase,'x-portal-role':l.role},body:JSON.stringify(body)});return {status:r.status,body:await r.json()}};
   const occupiedNow=await api(E.PIN_ADMIN,'/bookings',{tableId:4,guestName:'Tap Blocked',customerPhone:'+919000000002',bookingDate:ymd(soon),bookingTime:hhmm(soon),durationMinutes:90});
   if(ymd(soon)===ymd(new Date()))assert.equal(occupiedNow.status,409,'server rejects occupied table within the hour');

   // 8: check-in opens the order with the booking's name and guests; cancelling it releases the table.
   const arrive=new Date(Date.now()+5*60000);
   if(ymd(arrive)===ymd(new Date())){
    const made=await api(E.PIN_ADMIN,'/bookings',{tableId:5,guestName:'Tap Arrival',guestCount:2,customerPhone:'+919000000003',bookingDate:ymd(arrive),bookingTime:hhmm(arrive),durationMinutes:60});assert.equal(made.status,201,JSON.stringify(made.body));
    await p.reload();await navTo(w,'Tables');w.resetCount();
    await w.tap(p.locator('.table-card').filter({hasText:'T05'}).locator('.table-card-main'));
    await w.tap(modal(p).getByRole('button',{name:'Check in & start order'}));await modal(p).getByPlaceholder('Search menu items…').waitFor({timeout:15000});
    taps[`${L} reserved check-in to menu`]=w.count();
    const [seated]=await q(`SELECT o.guest_count,o.guest_name,o.booking_id,b.status FROM ${S}.orders o JOIN ${S}.bookings b ON b.id=o.booking_id WHERE o.table_id=5 AND o.status='new' ORDER BY o.id DESC LIMIT 1`);
    assert.deepEqual([seated.guest_count,seated.guest_name,seated.status],[2,'Tap Arrival','seated']);
    await w.tap(modal(p).locator('summary',{hasText:'More options'}));await w.tap(modal(p).getByRole('button',{name:'Cancel empty group'}));await w.tap(modal(p).getByRole('button',{name:'Confirm cancellation'}));
    await toast(p,/cancelled/);const [t5]=await q(`SELECT status,active_booking_id FROM ${S}.restaurant_tables WHERE id=5`);assert.deepEqual([t5.status,t5.active_booking_id],['available',null]);
    const [b]=await q(`SELECT status FROM ${S}.bookings WHERE id=$1`,[made.body.id]);assert.equal(b.status,'cancelled');
   }
   // Shared table: 2 guests ordered at a 4-seat table, then 2 more arrive and get their own group.
   await p.keyboard.press('Escape').catch(()=>{});await p.locator('.modal').first().waitFor({state:'detached',timeout:5000}).catch(()=>{});
   if(!(await p.locator('.table-card').first().isVisible().catch(()=>false)))await navTo(w,'Tables');
   const t6=()=>p.locator('.table-card').filter({hasText:'T06'});
   await t6().locator('.table-card-main').click();await modal(p).getByRole('button',{name:'2 guests',exact:true}).click();
   await modal(p).getByRole('button',{name:`Add ${menu.name}`}).click();await modal(p).getByRole('button',{name:/^(Submit this order|Send to kitchen)/}).filter({visible:true}).first().click();
   await p.locator('.modal').first().waitFor({state:'detached',timeout:10000});
   await t6().getByText('2 of 4 seats taken · 2 free').waitFor();w.resetCount();
   await w.tap(t6().getByRole('button',{name:'New group · 2 free'}));
   await modal(p).getByText('Seat a new group').waitFor();assert.equal(await modal(p).locator('.guest-chip').count(),3,'chips = 2 free seats + Other');
   await w.tap(modal(p).getByRole('button',{name:'2 guests',exact:true}));await modal(p).getByPlaceholder('Search menu items…').waitFor();
   taps[`${L} second group at shared table`]=w.count();
   await modal(p).getByRole('button',{name:`Add ${menu.name}`}).click();await modal(p).getByRole('button',{name:/^(Submit this order|Send to kitchen)/}).filter({visible:true}).first().click();
   await p.locator('.modal').first().waitFor({state:'detached',timeout:10000});
   await t6().getByText('4 of 4 seats taken · full').waitFor();assert.equal(await t6().locator('.table-card-group').count(),2);
   assert.equal(await t6().getByRole('button',{name:/New group/}).count(),1,'still allowed when full (extra chairs via Other)');
   const shared=await q(`SELECT guest_count FROM ${S}.orders WHERE table_id=6 AND status NOT IN ('completed','cancelled') ORDER BY id`);assert.deepEqual(shared.map(r=>r.guest_count),[2,2]);
   await t6().locator('.table-card-main').click();await modal(p).getByText('4 of 4 seats taken · no seats free').waitFor();assert.equal(await modal(p).locator('.session-card').count(),2);
   await p.keyboard.press('Escape');
   await noOverflow(p,L);assert.deepEqual(w.errors,[]);await w.ctx.close();

   // 11–15: parcel with optional name, tap-to-add, one-screen handoff with parcel charge.
   a.resetCount();await navTo(a,'Parcel Orders');
   await a.tap(ap.getByRole('button',{name:'New parcel order'}));
   const pb=modal(ap),dish=pb.locator('.menu-list>button').filter({hasText:menu.name});
   await a.tap(dish);await a.tap(dish);await pb.getByText('×2 · add').waitFor();
   await a.tap(pb.getByRole('button',{name:'Send parcel to kitchen'}));await toast(ap,/Parcel sent to Chef/);
   const [parcel]=await q(`SELECT id,guest_name FROM ${S}.orders WHERE order_type='parcel' ORDER BY id DESC LIMIT 1`);assert.equal(parcel.guest_name,`Parcel #${parcel.id}`);
   taps[`${L} new parcel`]=a.count();
   await chefAdvance(width,'Open parcel queue',parcel.id,['Start preparing','Mark ready','Mark collected']);
   await ap.waitForTimeout(1500);a.resetCount();
   const pc=ap.locator('.parcel-card').filter({hasText:`#${parcel.id}`});await a.tap(pc.getByRole('button',{name:'Complete parcel handoff'}));
   const h=modal(ap);await h.getByRole('heading',{name:`Parcel #${parcel.id}`}).waitFor();
   await h.getByLabel('Parcel Charge (₹)').fill('20');await h.locator('.parcel-handoff-actions h3').filter({hasText:'320'}).waitFor();
   if(split){await a.tap(h.getByRole('button',{name:/Split payment/}));await h.getByLabel('Card / UPI amount').fill('120');assert.equal(await h.getByLabel('Cash amount').inputValue(),'200');
    await a.tap(h.getByRole('button',{name:'Record Cash ₹200 + Card / UPI ₹120'}));await toast(ap,new RegExp(`Parcel #${parcel.id} completed by Cash ₹200 \\+ Card / UPI ₹120 · ₹320`))}
   else{await a.tap(h.getByRole('button',{name:/Cash received/}));await toast(ap,new RegExp(`Parcel #${parcel.id} completed by Cash · ₹320`))}
   await ap.locator('.modal').first().waitFor({state:'detached',timeout:5000});
   const [done]=await q(`SELECT status,payment_status,payment_method,total::float total,parcel_charge::float charge,bill_number FROM ${S}.orders WHERE id=$1`,[parcel.id]);
   assert.deepEqual([done.status,done.payment_status,done.payment_method,done.total,done.charge],['completed','paid',split?'Split':'Cash',320,20]);assert(done.bill_number);
   taps[`${L} parcel handoff`]=a.count();
   await a.tap(ap.locator('.parcel-card').filter({hasText:`#${parcel.id}`}).getByRole('button',{name:/View \/ print bill/}));
   await modal(ap).getByText(`Bill No #${done.bill_number}`).first().waitFor();await modal(ap).locator('.parcel-handoff-actions').getByText('320').first().waitFor();
   await noOverflow(ap,L);assert.deepEqual(a.errors,[]);await a.ctx.close();
   console.log('PASS',L);
  }
  console.log('TAPS',JSON.stringify(taps,null,1));
 }finally{await reset().catch(()=>{});await q("UPDATE knockout_master.companies SET template_id=(SELECT id FROM knockout_master.ui_templates WHERE code='classic') WHERE database_name='knockout'").catch(()=>{});await browser.close();await db.end()}
})().catch(e=>{console.error(e);process.exit(1)});
