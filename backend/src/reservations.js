import {pool} from './database.js';
const fail=(message,status=409)=>Object.assign(new Error(message),{status});
export const reservationWindow = alias => `NOW() >= ((${alias}.booking_date::date + ${alias}.booking_time::time) - COALESCE((SELECT reservation_early_minutes FROM settings WHERE id=1),0) * INTERVAL '1 minute') AND NOW() < ((${alias}.booking_date::date + ${alias}.booking_time::time) + ${alias}.duration_minutes * INTERVAL '1 minute')`;
export async function currentReservation(conn,tableId) {
 const [[booking]]=await conn.query(`SELECT b.id,b.booking_time FROM bookings b WHERE b.table_id=? AND b.status='confirmed' AND ${reservationWindow('b')} ORDER BY b.booking_date,b.booking_time LIMIT 1`,[tableId]);
 return booking;
}
export async function checkInBooking(req,res) {
 const role=req.portalSession.role;
 if(!['admin','waiter'].includes(role))return res.status(403).json({message:'Admin or Waiter access required'});
 const conn=await pool.getConnection();
 try {
  await conn.beginTransaction();
  const [[target]]=await conn.query('SELECT table_id FROM bookings WHERE id=?',[req.params.id]);
  if(!target)throw fail('Reservation not found',404);
  // Table first: same lock order as booking creation, cancellation and order creation.
  const [[table]]=await conn.query('SELECT * FROM restaurant_tables WHERE id=? FOR UPDATE',[target.table_id]);
  const [[booking]]=await conn.query(`SELECT b.*,(${reservationWindow('b')}) AS eligible FROM bookings b WHERE b.id=? FOR UPDATE`,[req.params.id]);
  if(!table?.active)throw fail('Table is unavailable');
  if(booking.status==='seated'&&Number(table.active_booking_id)===Number(booking.id)){
   await conn.commit();return res.json({ok:true,bookingId:booking.id,tableId:table.id,alreadySeated:true});
  }
  if(booking.status!=='confirmed')throw fail('Only a confirmed reservation can be seated');
  if(!booking.eligible)throw fail('Check-in is available only during the configured reservation period');
  const [[activeOrder]]=await conn.query("SELECT id FROM orders WHERE table_id=? AND status NOT IN ('completed','cancelled') LIMIT 1",[table.id]);
  if(table.order_id||activeOrder||table.active_booking_id||table.status==='occupied')throw fail('This table is already occupied');
  if(table.status==='cleaning')throw fail('Mark the table clean before seating the guest');
  const [[other]]=await conn.query(`SELECT b.id FROM bookings b WHERE b.table_id=? AND b.id<>? AND b.status='confirmed' AND ${reservationWindow('b')} LIMIT 1`,[table.id,booking.id]);
  if(other)throw fail('Another reservation conflicts with this check-in');
  const [[staff]]=await conn.query('SELECT id FROM users WHERE id=? AND role=? AND active=TRUE AND deleted_at IS NULL',[req.portalSession.id,role]);
  if(!staff)throw fail('Active staff account required',403);
  await conn.query("UPDATE bookings SET status='seated',seated_at=NOW(),seated_by=? WHERE id=?",[staff.id,booking.id]);
  await conn.query("UPDATE restaurant_tables SET status='occupied',active_booking_id=?,guest_name=?,booking_time=? WHERE id=?",[booking.id,booking.guest_name,booking.booking_time,table.id]);
  await conn.commit();res.json({ok:true,bookingId:booking.id,tableId:table.id});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
}
export async function cancelBooking(req,res) {
 if(req.portalSession.role!=='admin')return res.status(403).json({message:'Only Admin can cancel table bookings'});
 const conn=await pool.getConnection();
 try{
  await conn.beginTransaction();
  const [[target]]=await conn.query('SELECT table_id FROM bookings WHERE id=?',[req.params.id]);if(!target)throw fail('Reservation not found',404);
  await conn.query('SELECT id FROM restaurant_tables WHERE id=? FOR UPDATE',[target.table_id]);
  const [result]=await conn.query("UPDATE bookings SET status='cancelled' WHERE id=? AND status='confirmed'",[req.params.id]);
  if(!result.affectedRows)throw fail('Only confirmed reservations can be cancelled');
  const next=await currentReservation(conn,target.table_id);
  await conn.query("UPDATE restaurant_tables SET status=?,booking_time=? WHERE id=? AND status='reserved' AND order_id IS NULL AND active_booking_id IS NULL",[next?'reserved':'available',next?.booking_time||'',target.table_id]);
  await conn.commit();res.json({ok:true});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
}
