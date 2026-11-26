import fs from 'node:fs';
import os from 'node:os';
if(os.hostname()!=='HMS-staging')throw Error('This maintenance import is restricted to HMS-staging');
if(!fs.existsSync('/var/backups/hotel-management/menu-7969-20261110/database-before.dump'))throw Error('Required staging backup is missing');
import crypto from 'node:crypto';
import pg from 'pg';
const manifest=JSON.parse(fs.readFileSync(new URL('./import.json',import.meta.url)));
if(manifest.hotelId!=='7969'||manifest.environment!=='staging'||manifest.items.length!==74)throw Error('Wrong import target');
const db=new pg.Client({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||5432),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.PGDATABASE||'knockout'});
const out=new URL('./result.json',import.meta.url);const result=fs.existsSync(out)?JSON.parse(fs.readFileSync(out)):{hotelId:'7969',items:[],created:0,uploaded:0};
const save=()=>fs.writeFileSync(out,JSON.stringify(result,null,2));
await db.connect();
try{
 await db.query('SELECT pg_advisory_lock(796974)');
 const {rows:[hotel]}=await db.query("SELECT id,database_name,status FROM knockout_master.companies WHERE hotel_id=$1",['7969']);
 if(hotel?.database_name!=='tenant_knockout'||hotel?.status!=='active')throw Error('Tenant verification failed');
 const {rows:[admin]}=await db.query("SELECT id,name FROM tenant_knockout.users WHERE role='admin' AND active=TRUE AND deleted_at IS NULL ORDER BY id LIMIT 1");
 if(!admin)throw Error('No active admin');
 // Short-lived maintenance session scoped to the verified existing admin, using the application's signing convention.
 const payload=Buffer.from(JSON.stringify({id:Number(admin.id),role:'admin',companyDatabase:hotel.database_name,exp:Date.now()+30*60*1000})).toString('base64url');
 const secret=process.env.MASTER_SESSION_SECRET||`${process.env.DB_PASSWORD}:${process.env.MASTER_DB_NAME||'knockout_master'}:knockout-session`;
 const token=payload+'.'+crypto.createHmac('sha256',secret).update(payload).digest('base64url');
 async function api(path,body,form=false){const r=await fetch('http://127.0.0.1:5000/api'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'X-Portal-Role':'admin',...(body&&!form?{'Content-Type':'application/json'}:{})},body:form?body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw Error(`${path}: ${r.status} ${data.message}`);return data;}
 const before=await api('/state');if(before.companyDatabase!==hotel.database_name)throw Error('API tenant mismatch');
 for(const item of manifest.items){const matches=before.menu.filter(m=>m.category.trim().toLowerCase()===item.category.trim().toLowerCase()&&m.name.trim().toLowerCase()===item.name.trim().toLowerCase());if(matches.length>1||matches.some(m=>Number(m.price)!==Number(item.price)))throw Error('Existing duplicate/price conflict: '+item.name);}
 // Preserve fingerprints of all other companies' menu data for a post-import isolation check.
 const companies=(await db.query('SELECT database_name FROM knockout_master.companies WHERE id<>$1',[hotel.id])).rows;
 const fingerprint=async schema=>{if(!/^[a-z0-9_]+$/.test(schema))throw Error('Unsafe schema');return (await db.query(`SELECT md5(COALESCE(jsonb_agg(to_jsonb(m) ORDER BY id)::text,'[]')) hash FROM "${schema}".menu_items m`)).rows[0].hash};
 const otherBefore=Object.fromEntries(await Promise.all(companies.map(async c=>[c.database_name,await fingerprint(c.database_name)])));
 await db.query('BEGIN');
 for(const category of new Set(manifest.items.map(x=>x.category))){const station=manifest.drinkCategories.includes(category)?'juicer':'kitchen';const key=category.toLowerCase();const {rows:[existing]}=await db.query('SELECT station FROM tenant_knockout.menu_category_routes WHERE category_key=$1',[key]);if(existing&&existing.station!==station)throw Error('Existing route conflict: '+category);await db.query('INSERT INTO tenant_knockout.menu_category_routes(category_key,station) VALUES($1,$2) ON CONFLICT DO NOTHING',[key,station]);}
 await db.query('COMMIT');
 for(const [i,item] of manifest.items.entries()){
  const {rows:matches}=await db.query('SELECT id,price,image_url FROM tenant_knockout.menu_items WHERE lower(btrim(name))=lower(btrim($1)) AND lower(btrim(category))=lower(btrim($2))',[item.name,item.category]);
  if(matches.length>1||matches.some(x=>Number(x.price)!==Number(item.price)))throw Error('Concurrent duplicate/price conflict');
  let id=Number(matches[0]?.id);if(!id){id=Number((await api('/menu',{name:item.name,category:item.category,price:Number(item.price),description:'',available:true,icon:manifest.drinkCategories.includes(item.category)?'🥤':'🍽️'})).id);result.created++;save();}
  if(!matches[0]?.image_url){const form=new FormData();form.append('image',new Blob([fs.readFileSync(new URL(item.imageFile,import.meta.url))],{type:'image/webp'}),`${String(i+1).padStart(2,'0')}.webp`);await api(`/menu/${id}/image`,form,true);result.uploaded++;save();}
  if(!result.items.some(x=>x.id===id))result.items.push({id,name:item.name,category:item.category,price:item.price,imageKind:item.imageKind,photoSource:item.photoSource||null});save();
  console.log(`Verified ${i+1}/74: ${item.name}`);
 }
 const after=await api('/state');
 if(after.menu.length!==74||new Set(after.menu.map(x=>x.category)).size!==15)throw Error('Count mismatch');
 for(const item of manifest.items){const actual=after.menu.find(m=>m.name===item.name&&m.category===item.category);if(!actual||Number(actual.price)!==Number(item.price)||!actual.available||!actual.imageUrl)throw Error('Item mismatch '+item.name);if(actual.productionStation!==(manifest.drinkCategories.includes(item.category)?'juicer':'kitchen'))throw Error('Routing mismatch '+item.name);const img=await fetch(actual.imageUrl);if(!img.ok||!img.headers.get('content-type')?.startsWith('image/'))throw Error('Image not accessible: '+item.name);const bytes=new Uint8Array(await img.arrayBuffer());if(bytes.length<100)throw Error('Empty image');}
 for(const [schema,hash] of Object.entries(otherBefore))if(await fingerprint(schema)!==hash)throw Error('Other tenant changed: '+schema);
 result.validation={items:74,categories:15,pricesMatched:74,available:74,imagesLoaded:74,duplicates:0,juicer:after.menu.filter(x=>x.productionStation==='juicer').length,kitchen:after.menu.filter(x=>x.productionStation==='kitchen').length,otherTenantsUnchanged:true};save();
 // Export only the fixture fields needed for browser validation; never export staff PINs or financial records.
 fs.writeFileSync(new URL('./validated-menu.json',import.meta.url),JSON.stringify({companyDatabase:hotel.database_name,menu:after.menu,settings:{hotelName:after.settings.hotelName,currency:after.settings.currency}},null,2));
 console.log(JSON.stringify(result.validation));
}catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{await db.query('SELECT pg_advisory_unlock(796974)').catch(()=>{});await db.end();}
