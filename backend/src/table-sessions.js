import {pool} from './database.js';
import {actor} from './staff-approval.js';
import {currentReservation} from './reservations.js';
const fail=(message,status=409)=>{throw Object.assign(new Error(message),{status})};
export async function syncTableSessions(conn,tableId,{releaseReservation=false,emptyStatus='available'}={}) {
 const [[table]]=await conn.query('SELECT * FROM restaurant_tables WHERE id=? FOR UPDATE',[tableId]);
 const [active]=await conn.query("SELECT id,guest_name FROM orders WHERE table_id=? AND status NOT IN ('completed','cancelled') ORDER BY id",[tableId]);
 if(active.length){await conn.query("UPDATE restaurant_tables SET status='occupied',order_id=?,guest_name=? WHERE id=?",[active[0].id,active[0].guest_name,tableId]);return}
 if(table.active_booking_id&&!releaseReservation){await conn.query("UPDATE restaurant_tables SET status='occupied',order_id=NULL WHERE id=?",[tableId]);return}
 const reservation=await currentReservation(conn,tableId);
 await conn.query("UPDATE restaurant_tables SET status=?,order_id=NULL,guest_name='',booking_time=?,active_booking_id=NULL WHERE id=?",[reservation?'reserved':emptyStatus,reservation?.booking_time||'',tableId]);
}
export async function createTableSession(req,res){
 if(req.portalSession.role!=='waiter')return res.status(403).json({message:'Waiter access required'});
 const tableId=Number(req.params.id),guests=Number(req.body.guestCount),name=req.body.guestName??'',key=req.body.requestKey;
 if(!Number.isSafeInteger(tableId)||tableId<1||!Number.isInteger(guests)||guests<1||guests>200||typeof name!=='string'||name.trim().length>120||typeof key!=='string'||!/^[-a-zA-Z0-9_]{16,80}$/.test(key))return res.status(400).json({message:'Enter 1–200 guests, an optional group name (120 characters maximum), and a valid request key'});
 const conn=await pool.getConnection();
 try{
 await conn.beginTransaction();const waiter=await actor(conn,req.portalSession);
 const [[table]]=await conn.query('SELECT * FROM restaurant_tables WHERE id=? FOR UPDATE',[tableId]);
 if(!table||!table.active)fail('Active table not found',404);
 const [[retry]]=await conn.query('SELECT id,table_id,guest_count,guest_name,status FROM orders WHERE session_key=?',[key]);
 if(retry){if(retry.table_id!==tableId||retry.guest_count!==guests||retry.guest_name!==(name.trim()||'Walk-in Guest'))fail('Request key already belongs to a different group');await conn.commit();res.locals.skipMutation=true;return res.json({id:retry.id,sessionId:retry.id,status:retry.status,unchanged:true})}
 if(table.status==='cleaning')fail('Mark the table clean before seating a group');
 if(await currentReservation(conn,tableId))fail('Seat the reserved guest before creating a session');
 let bookingId=null;
 if(table.active_booking_id){
  if(Number(req.body.bookingId)!==Number(table.active_booking_id))fail('This table belongs to its seated reservation');
  const [[existing]]=await conn.query("SELECT id FROM orders WHERE table_id=? AND status NOT IN ('completed','cancelled') LIMIT 1",[tableId]);
  if(existing)fail('A seated reservation cannot be shared with another group');bookingId=table.active_booking_id;
 }
 const [result]=await conn.query("INSERT INTO orders(table_id,booking_id,guest_name,guest_count,session_key,waiter,status,payment_status,created_at) VALUES(?,?,?,?,?,?,'new','unpaid',NOW())",[tableId,bookingId,name.trim()||'Walk-in Guest',guests,key,waiter.name]);
 await syncTableSessions(conn,tableId);await conn.commit();
 res.locals.broadcastDetails={action:'table_session_created',tableId,orderId:result.insertId};res.status(201).json({id:result.insertId,sessionId:result.insertId,status:'new'});
 }catch(error){await conn.rollback();if(error.code==='23505')fail('This group request was already used. Refresh the table.');throw error}finally{conn.release()}
}
