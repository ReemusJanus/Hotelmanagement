import {syncTableSessions} from './table-sessions.js';
import {pool} from './database.js';
import {actor} from './staff-approval.js';
const fail=(message,status=409)=>{throw Object.assign(new Error(message),{status})};

// Preserve the existing round-level preparation lock: one started item locks its round.
export function assertCancellable(order,lines,selected,wholeOrder){
 if(order.payment_status==='paid'||['billing_requested','completed','cancelled','served','received','collected'].includes(order.status))fail('Paid, served, handed-off or closed orders cannot be cancelled.');
 if(!selected.length&&!wholeOrder)fail('Item not found in order',404);
 const rounds=new Set(selected.map(x=>Number(x.batch_no)));
 if(wholeOrder&&order.status!=='new'||lines.some(x=>rounds.has(Number(x.batch_no))&&((x.production_status||'new')!=='new'||(x.handoff_status||'pending')!=='pending')))fail('Preparation has started. Items in this round cannot be cancelled.');
}
async function cancel(req,res,wholeOrder){
 if(!['waiter','admin'].includes(req.portalSession?.role))return res.status(403).json({message:'Waiter or Admin access required'});
 const id=Number(req.params.id),menuId=Number(req.params.menuId),batch=req.query?.batchNo===undefined?null:Number(req.query.batchNo),reason=req.body?.reason??'';
 if(!Number.isSafeInteger(id)||id<1||!wholeOrder&&(!Number.isSafeInteger(menuId)||menuId<1||batch!==null&&(!Number.isInteger(batch)||batch<1))||typeof reason!=='string'||reason.length>500)return res.status(400).json({message:'Invalid order, item, round or cancellation reason'});
 const conn=await pool.getConnection();
 try{
  await conn.beginTransaction();
  const user=await actor(conn,req.portalSession);
  // Match table-first locking used by order creation/reservation check-in.
  const [[lookup]]=await conn.query('SELECT table_id FROM orders WHERE id=?',[id]);
  if(!lookup)fail('Order not found',404);
  if(lookup.table_id)await conn.query('SELECT id FROM restaurant_tables WHERE id=? FOR UPDATE',[lookup.table_id]);
  const [[order]]=await conn.query('SELECT * FROM orders WHERE id=? FOR UPDATE',[id]);
  if(!order)fail('Order not found',404);
  if(req.portalSession.role==='waiter'&&order.order_type==='parcel')fail('Parcel orders are managed by Admin',403);
  if(wholeOrder&&order.status==='cancelled'){
   await conn.commit();res.locals.skipMutation=true;return res.json({ok:true,orderId:id,status:'cancelled',remainingCount:0,unchanged:true});
  }
  const [lines]=await conn.query('SELECT oi.*,m.name FROM order_items oi JOIN menu_items m ON m.id=oi.menu_id WHERE oi.order_id=? ORDER BY oi.id FOR UPDATE OF oi',[id]);
  if(req.body?.emptyOnly===true&&lines.length)fail('This group now has food orders. Refresh and review the orders before cancelling.');
  const selected=wholeOrder?lines:lines.filter(x=>Number(x.menu_id)===menuId&&(batch===null||Number(x.batch_no)===batch));
  assertCancellable(order,lines,selected,wholeOrder);
  const fullyCancelled=selected.length===lines.length;
  // Snapshot prices/quantities/names and actor before removing any active partial lines.
  await conn.query('INSERT INTO order_cancellations(order_id,actor_id,actor_name,actor_role,reason,whole_order,items) VALUES(?,?,?,?,?,?,?::jsonb)',[id,user.id,user.name,user.role,reason.trim()||'Cancelled by staff',fullyCancelled,JSON.stringify(selected)]);
  let status=order.status;
  if(fullyCancelled){
   status='cancelled';
   await conn.query("UPDATE orders SET status='cancelled',cancelled_at=NOW() WHERE id=?",[id]);
   if(order.table_id){
    // Last group of a seated reservation cancelled before cooking: release the reservation so the table is not stuck.
    const [[table]]=await conn.query('SELECT active_booking_id FROM restaurant_tables WHERE id=?',[order.table_id]);
    const [[others]]=await conn.query("SELECT COUNT(*)::int n FROM orders WHERE table_id=? AND id<>? AND status NOT IN ('completed','cancelled')",[order.table_id,id]);
    const release=!!order.booking_id&&Number(table?.active_booking_id)===Number(order.booking_id)&&!Number(others?.n);
    if(release)await conn.query("UPDATE bookings SET status='cancelled' WHERE id=? AND status='seated'",[order.booking_id]);
    await syncTableSessions(conn,order.table_id,release?{releaseReservation:true}:{});
   }
  }else{
   const ids=selected.map(x=>x.id);
   await conn.query(`DELETE FROM order_items WHERE order_id=? AND id IN (${ids.map(()=>'?').join(',')})`,[id,...ids]);
   const remaining=lines.filter(x=>!ids.includes(x.id));
   status=remaining.every(x=>x.handoff_status==='received')?'received':remaining.every(x=>['collected','received'].includes(x.handoff_status))?'collected':remaining.every(x=>x.production_status==='ready')?'ready':remaining.every(x=>x.production_status==='new')?'new':'preparing';
   await conn.query('UPDATE orders SET status=? WHERE id=?',[status,id]);
  }
  await conn.commit();
  res.locals.broadcastDetails={action:fullyCancelled?'order_cancelled':'order_item_cancelled',orderId:id,tableId:order.table_id,status};
  res.json({ok:true,orderId:id,status,remainingCount:fullyCancelled?0:lines.length-selected.length});
 }catch(error){await conn.rollback();throw error}finally{conn.release()}
}
export const cancelOrder=(req,res)=>cancel(req,res,true);
export const deleteOrderItem=(req,res)=>cancel(req,res,false);
