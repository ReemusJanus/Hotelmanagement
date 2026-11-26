import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {createPool} from './audit-src/postgres.js';
const pool=createPool({database:'tenant_knockout'});const conn=await pool.getConnection();
registerHooks({load(url,context,next){
 if(url.endsWith('/database.js'))return {format:'module',shortCircuit:true,source:'export const pool={getConnection:async()=>globalThis.testConn,query:(...args)=>globalThis.testConn.query(...args)};export const getState=async()=>({});'};
 if(url.endsWith('/uploads/storage-handler.js'))return {format:'module',shortCircuit:true,source:'export const putImage=()=>{},putReport=()=>{},storageProvider="test",minio={},bucket="test";'};
 return next(url,context);
}});
globalThis.testConn={query:(...args)=>conn.query(...args),beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release(){}};
const {updateOrderItemStatus,billFor,addOrderItems,deleteOrderItem}=await import('./audit-src/controllers/tenant.controller.js');
try{
 await conn.beginTransaction();
 const [items]=await conn.query('SELECT id,price FROM menu_items ORDER BY id');assert.equal(items.length,74);
 await conn.query("INSERT INTO orders(id,order_type,waiter,status,payment_status,created_at) VALUES(-7969,'dine_in','Rollback-only menu verification','new','unpaid',NOW())");
 for(const [n,item] of items.entries())await conn.query("INSERT INTO order_items(id,order_id,menu_id,quantity,price) VALUES(?,-7969,?,1,?)",[-796900-n,item.id,item.price]);
 const bill=await billFor(-7969,conn);assert.equal(bill.total,items.reduce((a,b)=>a+Number(b.price),0));
 let output;const response={json(x){output=x}};
 await updateOrderItemStatus({portalSession:{role:'juicer'},params:{id:-7969},body:{status:'preparing',batchNo:1}},response);assert.equal(output.updatedItems,38);
 const [counts]=await conn.query("SELECT production_status,count(*)::int n FROM order_items WHERE order_id=-7969 GROUP BY production_status");assert.equal(counts.find(x=>x.production_status==='preparing').n,38);assert.equal(counts.find(x=>x.production_status==='new').n,36);
 await assert.rejects(addOrderItems({portalSession:{role:'waiter'},params:{id:-7969},body:{batchNo:1,items:[{menuId:items[0].id,qty:1}]}},response),e=>e.status===409);
 await assert.rejects(deleteOrderItem({portalSession:{role:'waiter'},params:{id:-7969,menuId:items[0].id},query:{batchNo:1}},response),e=>e.status===409);
 await updateOrderItemStatus({portalSession:{role:'chef'},params:{id:-7969},body:{status:'ready',batchNo:1}},response);assert.equal(output.updatedItems,36);assert.equal(output.orderStatus,'preparing');
 await updateOrderItemStatus({portalSession:{role:'juicer'},params:{id:-7969},body:{status:'ready',batchNo:1}},response);assert.equal(output.updatedItems,38);assert.equal(output.orderStatus,'ready');
 console.log(JSON.stringify({realDatabaseRouting:'passed',juicer:38,kitchen:36,mixedOrderProgress:'passed',waiterPreparationLock:'passed',billTotal:bill.total,transaction:'rolled back; no test orders or sales persisted'}));
}finally{await conn.rollback();conn.release();await pool.end();}
