import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {isJuiceItem,stationSQL} from '../src/production-routing.js';
import {isJuiceItem as webRoute} from '../../frontend/src/production-routing.js';
import {isJuiceItem as mobileRoute} from '../../mobile/production-routing.js';
registerHooks({load(url,context,next){
 if(url.endsWith('/src/database.js'))return {format:'module',shortCircuit:true,source:'export const pool={getConnection:async()=>globalThis.routingConnection,query:(...args)=>globalThis.routingConnection.query(...args)}; export const getState=async()=>({});'};
 if(url.endsWith('/src/uploads/storage-handler.js'))return {format:'module',shortCircuit:true,source:'export const putImage=()=>{},putReport=()=>{},storageProvider="test",minio={},bucket="test";'};
 return next(url,context);
}});
const {updateOrderItemStatus,updateMenuItemAvailability}=await import('../src/controllers/tenant.controller.js');
test('all clients honour configured category station; legacy menus remain compatible',()=>{
 for(const route of [isJuiceItem,webRoute,mobileRoute]){
  for(const category of ['Fresh Juice','Falooda','Beverages','Sharja Shake','Karikku Shakes','Any future category']) assert.equal(route({category,productionStation:'juicer'}),true);
  assert.equal(route({category:'Juices',productionStation:'kitchen'}),false);
  assert.equal(route({category:' Juices '}),true);
  assert.equal(route({category:'Starter',productionStation:'kitchen'}),false);
 }
 assert.throws(()=>stationSQL('m;DROP'));
});
for(const role of ['chef','juicer'])test(`${role} updates only its own lines in a mixed batch`,async()=>{
 let written;
 globalThis.routingConnection={beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release(){},query:async(sql,params)=>{
  if(sql.startsWith('SELECT id,status,order_type FROM orders'))return [[{id:1}]];
  if(sql.startsWith('SELECT oi.id')){assert.match(sql,/menu_category_routes/);return [[{id:10,category:'Falooda',productionStation:'juicer',p:'new',h:'pending'},{id:20,category:'Starter',productionStation:'kitchen',p:'new',h:'pending'}]];}
  if(sql.startsWith('UPDATE order_items')){written=params;return [{}];}
  if(sql.startsWith('SELECT production_status'))return [[{p:'preparing',h:'pending'},{p:'new',h:'pending'}]];
  if(sql.startsWith('UPDATE orders'))return [{}];
  throw Error(sql);
 }};
 let response;
 await updateOrderItemStatus({portalSession:{role},params:{id:1},body:{batchNo:1,status:'preparing'}},{json:v=>response=v});
 assert.deepEqual(written,['preparing',role==='juicer'?10:20]);assert.equal(response.updatedItems,1);
});
test('juicer cannot change food availability but can change a mapped drink',async()=>{
 for(const station of ['kitchen','juicer']){
  let writes=0,code=200;
  globalThis.routingConnection={query:async sql=>{if(sql.startsWith('SELECT category'))return [[{category:'Falooda',productionStation:station}]];writes++;return [{affectedRows:1}];}};
  const res={status(n){code=n;return this},json(){}};
  await updateMenuItemAvailability({portalSession:{role:'juicer'},params:{id:1},body:{available:true}},res);
  assert.equal(code,station==='juicer'?200:403);assert.equal(writes,station==='juicer'?1:0);
 }
});
