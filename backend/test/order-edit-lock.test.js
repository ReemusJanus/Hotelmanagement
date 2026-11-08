import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({load(url,context,next){
 if(url.endsWith('/src/database.js'))return {format:'module',shortCircuit:true,source:'export const pool={getConnection:async()=>globalThis.orderEditConnection}; export const getState=async()=>({});'};
 if(url.endsWith('/src/uploads/storage-handler.js'))return {format:'module',shortCircuit:true,source:'export const putImage=()=>{},putReport=()=>{},storageProvider="test",minio={},bucket="test";'};
 return next(url,context);
}});
const {addOrderItems,deleteOrderItem}=await import('../src/controllers/tenant.controller.js');
for(const status of ['preparing','ready'])test(`reject additions and removal when another item in the round is ${status}`,async()=>{
 let writes=0,rollbacks=0;
 globalThis.orderEditConnection={beginTransaction:async()=>{},rollback:async()=>{rollbacks++},release(){},query:async sql=>{
  if(sql.startsWith('SELECT id,status'))return [[{id:1,status:'preparing'}]];
  if(sql.includes('MAX(batch_no)'))return [[{batchNo:1}]];
  if(sql.startsWith('SELECT production_status,'))return [[{production_status:'new'},{production_status:status}]];
  if(sql.startsWith('SELECT menu_id,'))return [[{menu_id:2,batch_no:1,production_status:'new'},{menu_id:3,batch_no:1,production_status:status}]];
  writes++;throw Error('Unexpected mutation');
 }};
 const req={portalSession:{role:'waiter'},params:{id:1,menuId:2},query:{batchNo:1},body:{batchNo:1,items:[{menuId:2,qty:1}]}};
 await assert.rejects(addOrderItems(req,{}),e=>e.status===409);
 await assert.rejects(deleteOrderItem(req,{}),e=>e.status===409);
 assert.equal(writes,0);assert.equal(rollbacks,2);
});
for(const newRound of [false,true])test(newRound?'new rounds remain editable':'unstarted rounds remain editable',async()=>{
 const reachedMenu=new Error('passed preparation guard');
 globalThis.orderEditConnection={beginTransaction:async()=>{},rollback:async()=>{},release(){},query:async sql=>{
  if(sql.startsWith('SELECT id,status'))return [[{id:1,status:newRound?'preparing':'new'}]];
  if(sql.includes('MAX(batch_no)'))return [[{batchNo:1}]];
  if(sql.startsWith('SELECT production_status,'))return [newRound?[]:[{production_status:'new',handoff_status:'pending'}]];
  if(sql.startsWith('SELECT price'))throw reachedMenu;
  throw Error('Unexpected query');
 }};
 await assert.rejects(addOrderItems({portalSession:{role:'waiter'},params:{id:1},body:{batchNo:newRound?2:1,items:[{menuId:2,qty:1}]}},{}),e=>e===reachedMenu);
});
