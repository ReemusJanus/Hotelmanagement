import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../src/api.js',import.meta.url),'utf8')).replaceAll('import.meta.env','({})');
const {api,apiForm}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const storage=()=>{const values=new Map();return{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
function setup(){globalThis.sessionStorage=storage();globalThis.localStorage=storage();globalThis.window={dispatchEvent:event=>events.push(event.type)};sessionStorage.setItem('knockout-portal-user',JSON.stringify({role:'admin',companyDatabase:'tenant_a'}));sessionStorage.setItem('knockout-access-token','a');events=[];}
let events;
for(const form of [false,true])test(`${form?'multipart':'JSON'} old unauthorized response must not revoke the new tenant session`,async()=>{
 setup();let finish;globalThis.fetch=()=>new Promise(resolve=>finish=resolve);
 const pending=form?apiForm('/settings',new FormData()):api('/state');
 sessionStorage.setItem('knockout-access-token','b');sessionStorage.setItem('knockout-portal-user',JSON.stringify({role:'admin',companyDatabase:'tenant_b'}));
 finish(new Response(JSON.stringify({message:'expired'}),{status:401,headers:{'content-type':'application/json'}}));
 await assert.rejects(pending,/expired/);assert.equal(sessionStorage.getItem('knockout-access-token'),'b');assert.deepEqual(events,[]);
});
test('current unauthorized session is still revoked',async()=>{setup();globalThis.fetch=async()=>new Response(JSON.stringify({message:'expired'}),{status:401});await assert.rejects(api('/state'),/expired/);assert.equal(sessionStorage.getItem('knockout-access-token'),null);assert.deepEqual(events,['knockout:session-revoked'])});
test('invalid successful JSON and upload responses are actionable errors, never false success',async()=>{setup();globalThis.fetch=async()=>new Response('<html>proxy response</html>',{status:200});await assert.rejects(api('/state'),/invalid response \(200\)/);await assert.rejects(apiForm('/settings',new FormData()),/invalid response \(200\)/)});
