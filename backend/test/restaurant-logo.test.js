import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({load(url,context,next){
 if(url.endsWith('/src/uploads/storage-handler.js'))return{format:'module',shortCircuit:true,source:`
 export const bucket='test',storageProvider='test';
 export const minio={removeObject:async(_bucket,key)=>globalThis.logoRemoved.push(key)};
 export const putImage=async(owner,name)=>{const objectName=owner+'/images/'+name;globalThis.logoUploaded.push(objectName);return{objectName,url:'https://assets.example/'+objectName}};
 export const putReport=async()=>({});`};
 return next(url,context);
}});
const {updateSettings}=await import('../src/controllers/tenant.controller.js');
const {runWithTenant,closePools}=await import('../src/database.js');
const {createPool}=await import('../src/postgres.js');
const {ensureSchema,tenantDDL}=await import('../src/schema.js');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
const file={buffer:png,size:png.length,mimetype:'image/png'};
test('restaurant logos: tenant isolation, validation, replace, remove and atomic failure',{skip:!process.env.PG_LOGO_TEST},async()=>{
 globalThis.logoUploaded=[];globalThis.logoRemoved=[];
 const control=createPool({database:'public'}), tenants=[`tenant_logo_a_${process.pid}`,`tenant_logo_b_${process.pid}`];
 const body={hotelName:'Identical restaurant name',currency:'INR',taxRate:2.5,cgstRate:2.5,serviceCharge:18,showLogoOnBill:'true',showLogoWatermark:'true'};
 const save=async(tenant,overrides={})=>{let response;const res={status(code){this.code=code;return this},json(data){response={code:this.code||200,...data}}};await runWithTenant(tenant,()=>updateSettings({portalSession:{role:'admin',companyDatabase:tenant},body:{...body},file,...overrides},res));return response};
 try{
  for(const tenant of tenants){const c=await control.getConnection();try{await c.beginTransaction();await ensureSchema(c,tenant,tenantDDL);await ensureSchema(c,tenant,tenantDDL);await c.query("INSERT INTO settings(id,hotel_name) VALUES(1,'Test')");await c.commit()}finally{c.release()}}
  assert.equal((await save(tenants[0],{portalSession:{role:'waiter',companyDatabase:tenants[0]}})).code,403);
  assert.equal(logoUploaded.length,0);
  await assert.rejects(save(tenants[0],{file:{...file,size:2097153}}),e=>e.status===413);
  await assert.rejects(save(tenants[0],{file:{...file,mimetype:'image/jpeg'}}),e=>e.status===400);
  await assert.rejects(save(tenants[0],{file:{...file,buffer:Buffer.from('not an image')}}),e=>e.status===400);
  await assert.rejects(save(tenants[0],{body:{...body,showLogoWatermark:'yes'}}),e=>e.status===400);
  const a=await save(tenants[0]),b=await save(tenants[1]);
  assert(a.settings.logoUrl.includes(tenants[0]));assert(b.settings.logoUrl.includes(tenants[1]));assert.notEqual(a.settings.logoUrl,b.settings.logoUrl);
  assert.equal(a.settings.showLogoWatermark,true);
  const replacement=await save(tenants[0]);assert.notEqual(replacement.settings.logoUrl,a.settings.logoUrl);assert(logoRemoved.includes(logoUploaded[0]));
  await assert.rejects(save(tenants[0],{body:{...body,taxRate:'invalid'}}));
  assert(logoRemoved.includes(logoUploaded.at(-1)),'failed upload is cleaned');
  const [[persisted]]=await control.query(`SELECT logo_url FROM ${tenants[0]}.settings`);assert.equal(persisted.logo_url,replacement.settings.logoUrl);
  const removed=await save(tenants[0],{file:undefined,body:{...body,removeLogo:'true',showLogoWatermark:'false'}});assert.equal(removed.settings.logoUrl,null);assert.equal(removed.settings.showLogoWatermark,false);
  const [[other]]=await control.query(`SELECT logo_url FROM ${tenants[1]}.settings`);assert.equal(other.logo_url,b.settings.logoUrl);
  const legacy=await save(tenants[1],{file:undefined,body:{hotelName:'Renamed',currency:'INR',taxRate:2.5,cgstRate:2.5,serviceCharge:18}});assert.equal(legacy.settings.logoUrl,b.settings.logoUrl);assert.equal(legacy.settings.showLogoWatermark,true);
 }finally{await closePools();for(const tenant of tenants)await control.query(`DROP SCHEMA IF EXISTS ${tenant} CASCADE`);await control.end()}
});

test('logo multipart parser enforces type and 2 MB before controller execution',async()=>{
 const {default:express}=await import('express');
 const {uploadRestaurantLogo}=await import('../src/uploads/multer.js');
 const app=express();let accepted=0;
 app.put('/settings',uploadRestaurantLogo,(req,res)=>{accepted++;res.json({size:req.file.size})});
 app.use((error,req,res,next)=>res.status(error.code==='LIMIT_FILE_SIZE'?413:400).json({message:error.message}));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s))});
 try{
  const send=async(bytes,type)=>{const form=new FormData();form.set('logo',new Blob([bytes],{type}),'logo.png');return fetch(`http://127.0.0.1:${server.address().port}/settings`,{method:'PUT',body:form})};
  assert.equal((await send(png,'image/png')).status,200);
  assert.equal((await send(Buffer.alloc(2*1024*1024+1),'image/png')).status,413);
  assert.equal((await send(Buffer.from('<svg/>'),'image/svg+xml')).status,400);
  assert.equal((await send(png,'text/plain')).status,400);
  assert.equal(accepted,1);
 }finally{await new Promise(resolve=>server.close(resolve))}
});
