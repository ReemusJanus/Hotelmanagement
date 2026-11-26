const assert=require('node:assert/strict');
const {chromium}=require('/Users/reemusjanus/Library/Caches/ms-playwright-go/1.57.0/package');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});try{
for(const width of [320,375,820,1440]){
const page=await browser.newPage({viewport:{width,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{sessionStorage.setItem('knockout-portal-user',JSON.stringify({id:1,name:'Master Administrator',role:'superadmin'}));sessionStorage.setItem('knockout-access-token','fixture');window.WebSocket=class{close(){}};});
await page.route('**/api/**',r=>r.fulfill({json:{companies:[],invoices:[],usage:[],subscriptions:[],registrationRequests:[]}}));
await page.goto('http://127.0.0.1:5252');
await page.getByRole('heading',{name:'Platform overview',exact:true}).waitFor();
if(width<1100){
await page.getByRole('button',{name:'Menu',exact:true}).click();
const drawer=page.locator('.mobile-navigation-drawer');
await drawer.getByRole('button',{name:'SaaS Billing',exact:true}).click();
await drawer.waitFor({state:'detached'});
await page.getByRole('button',{name:'Menu',exact:true}).click();
await drawer.getByRole('button',{name:'Dashboard',exact:true}).click();
await page.getByRole('heading',{name:'Platform overview',exact:true}).waitFor();
assert(await page.locator('.mobile-header-account').getByRole('button',{name:'Logout'}).isVisible());
assert.equal(await page.locator('.master-shell main>header').isVisible(),false);
await page.screenshot({path:'/private/tmp/master-mobile-'+width+'.png'});
}else assert(await page.locator('.master-shell main>header').isVisible());
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
assert.deepEqual(errors,[]);
await page.getByRole('button',{name:'Logout',exact:true}).locator('visible=true').first().click();
assert.equal(await page.evaluate(()=>sessionStorage.getItem('knockout-portal-user')),null);
console.log('PASS master render, navigation, logout '+width);await page.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
