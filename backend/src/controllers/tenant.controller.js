import {syncTableSessions} from '../table-sessions.js';
export {cancelOrder,deleteOrderItem} from '../order-cancellation.js';
import {actor,staffRequests} from '../staff-approval.js';
export {reviewStaff} from '../staff-approval.js';
export {updateOrderItemStatus,updateBatchHandoff,updateOrderStatus} from '../production-workflow.js';
import {currentReservation} from '../reservations.js';
export {checkInBooking, cancelBooking as deleteBooking} from '../reservations.js';
import {isJuiceItem, stationSQL} from '../production-routing.js';
import {getDashboard} from '../dashboard.js';
import {validTenant} from '../middleware/auth.js';
import { imageExtension } from '../security.js';
import { assignDailyBillNumber } from '../billing-number.js';
import crypto from 'node:crypto';
import { pool, getState } from '../database.js';
import {
  putImage,
  putReport,
  storageProvider,
  minio,
  bucket
} from '../uploads/storage-handler.js';

const stateCache = new Map();
const stateCacheTtl = Math.max(100, Number(process.env.STATE_CACHE_TTL_MS || 1000));

export function clearStateCache(database) {
  if (database) stateCache.delete(database);
  else stateCache.clear();
}

export async function storageOwner() {
  const [[settings]] = await pool.query('SELECT hotel_name "hotelName" FROM settings WHERE id=1');
  return settings?.hotelName || 'knockout';
}

export async function ensureUniquePortalPin({ pin, currentDatabase, excludeId = null }) {
  const params = [String(pin)];
  let sql = 'SELECT id,name FROM users WHERE pin=? AND deleted_at IS NULL';
  if (excludeId) {
    sql += ' AND id<>?';
    params.push(excludeId);
  }
  sql += ' LIMIT 1';
  const [[used]] = await pool.query(sql, params);
  if (used) throw Object.assign(new Error('This PIN is already assigned to another user in this hotel.'), { status: 409 });
}

export async function generatePortalPin() {
  for (let attempt = 0; attempt < 200; attempt++) {
    const pin = String(crypto.randomInt(100000, 1000000));
    const [[used]] = await pool.query('SELECT id FROM users WHERE pin=? AND deleted_at IS NULL LIMIT 1', [pin]);
    if (!used) return pin;
  }
  throw Object.assign(new Error('Unable to generate a unique user PIN. Please try again.'), { status: 503 });
}

export async function billFor(orderId, conn = pool) {
  const [[settings]] = await conn.query('SELECT tax_rate "taxRate",cgst_rate "cgstRate",service_charge "serviceCharge" FROM settings WHERE id=1');
  const [items] = await conn.query('SELECT oi.menu_id "menuId",oi.quantity qty,oi.note,oi.price,m.name,m.icon,m.image_url "imageUrl" FROM order_items oi JOIN menu_items m ON m.id=oi.menu_id WHERE oi.order_id=?', [orderId]);
  const [[order]] = await conn.query("SELECT CASE WHEN order_type='parcel' THEN parcel_charge ELSE 0 END \"parcelCharges\" FROM orders WHERE id=?", [orderId]);
  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const tax = 0, cgst = 0, service = 0, parcelCharges = Number(order?.parcelCharges || 0);
  // One stored value per order, so retries and reprints can never add the charge twice.
  return { items: items.map(i => ({ ...i, price: Number(i.price) })), subtotal, tax, cgst, service, parcelCharges, total: Math.round((subtotal + parcelCharges) * 100) / 100 };
}

/** Parcel charge in rupees: optional, non-negative, at most 2 decimals. Returns null when absent. */
export function parcelChargeInput(value) {
  if (value === undefined || value === null || value === '') return null;
  const charge = Number(value);
  if (!Number.isFinite(charge) || charge < 0 || charge > 100000 || Math.round(charge * 100) !== charge * 100) throw Object.assign(new Error('Parcel charge must be between ₹0 and ₹1,00,000 with at most 2 decimals'), { status: 400 });
  return charge;
}
/** Sets the charge on an unpaid parcel inside the caller's transaction (row already locked). */
async function applyParcelCharge(conn, order, charge) {
  if (charge === null) return;
  const current = Number(order.parcel_charge || 0);
  if (order.order_type !== 'parcel') { if (charge !== 0) throw Object.assign(new Error('Parcel charge applies only to parcel orders'), { status: 400 }); return; }
  if (order.payment_status === 'paid' || ['completed', 'cancelled'].includes(order.status)) {
    if (charge !== current) throw Object.assign(new Error('The parcel charge cannot be changed after payment'), { status: 409 });
    return;
  }
  if (charge !== current) await conn.query('UPDATE orders SET parcel_charge=? WHERE id=?', [charge, order.id]);
}

export async function setParcelCharge(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Only Admin can set the parcel charge' });
  const charge = parcelChargeInput(req.body?.parcelCharge);
  if (charge === null) return res.status(400).json({ message: 'Enter a parcel charge (0 for none)' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query('SELECT id,order_type,status,payment_status,parcel_charge FROM orders WHERE id=? FOR UPDATE', [req.params.id]);
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (order.order_type !== 'parcel') throw Object.assign(new Error('Parcel charge applies only to parcel orders'), { status: 400 });
    await applyParcelCharge(conn, order, charge);
    const bill = await billFor(order.id, conn);
    await conn.commit();
    res.json({ id: order.id, parcelCharges: bill.parcelCharges, bill });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}


export async function refreshOrderProductionStatus(orderId, conn = pool) {
  const [lines] = await conn.query('SELECT production_status "itemStatus" FROM order_items WHERE order_id=?', [orderId]);
  if (!lines.length) return 'new';
  const next = lines.every(line => line.itemStatus === 'ready') ? 'ready' : lines.every(line => line.itemStatus === 'new') ? 'new' : 'preparing';
  await conn.query("UPDATE orders SET status=? WHERE id=? AND status IN ('new','preparing','ready')", [next, orderId]);
  return next;
}

export async function sendBookingConfirmation(phone, message) {
  const url = String(process.env.SMS_WEBHOOK_URL || '').trim();
  if (!url) return { status: 'queued', detail: 'SMS gateway is not configured' };
  const headers = { 'content-type': 'application/json' };
  if (process.env.SMS_WEBHOOK_TOKEN) headers.authorization = `Bearer ${process.env.SMS_WEBHOOK_TOKEN}`;
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ to: phone, message, channel: 'sms', source: 'KnockOUT' }) });
  if (!response.ok) throw new Error(`SMS gateway returned ${response.status}`);
  return { status: 'sent' };
}

export async function verifyPortalStaff(userId, portalRole) {
  const [[staff]] = await pool.query('SELECT id,name,role FROM users WHERE id=? AND active=TRUE AND deleted_at IS NULL', [userId]);
  if (!staff) return null;
  if (portalRole !== 'admin' && staff.role !== portalRole) return null;
  return staff;
}

// ------------------- Handlers -------------------

export async function getLive(req, res) {
  res.json({ ok: true, service: `knockout-${req.portalSession?.role || 'portal'}-api` });
}

export async function getHealth(req, res) {
  const role = req.portalSession?.role || 'admin';
  await pool.query('SELECT 1');
  res.json({ ok: true, service: `knockout-${role}-api`, portal: role, database: 'postgresql', storage: storageProvider });
}

export async function getStateController(req, res) {
  const role = req.portalSession?.role;
  const database = req.portalSession?.companyDatabase;
  if (!validTenant(database) || !['admin','waiter','chef','juicer'].includes(role)) return res.status(401).json({message:'A verified tenant session is required'});
  const now = Date.now();
  let cached = stateCache.get(database);
  if (!cached || cached.expiresAt <= now) {
    const promise = Promise.all([getState(),getDashboard(pool)]).then(([state,dashboard])=>({...state,dashboard})).catch(error => {
      stateCache.delete(database);
      throw error;
    });
    cached = { promise, expiresAt: now + stateCacheTtl };
    stateCache.set(database, cached);
  }
  const state = structuredClone(await cached.promise);
  state.companyDatabase = database;
  state.staffRequests = await staffRequests(role,req.portalSession.id);
  state.users=state.users.map(u=>u.approvalStatus && u.approvalStatus!=='approved'?{...u,pin:undefined}:u);
  if(role==='chef')state.kitchenStaff=state.kitchenStaff.filter(x=>x.approvalStatus==='approved'||Number(x.requestedBy)===Number(req.portalSession.id));
  else if(role!=='admin')delete state.kitchenStaff;
  if (role !== 'admin') {
    delete state.dashboard;
    if (role !== 'chef') {
      delete state.inventory;
      delete state.stockRequests;
    }
    delete state.inventoryTransactions;
    delete state.financeEntries;
    delete state.users;
    delete state.attendance;
  }
  res.set('Cache-Control', 'private, no-cache');
  res.json(state);
}

export async function postLogin(req, res) {
  const role = req.portalRole || req.portalSession?.role || req.headers['x-portal-role'];
  const [[user]] = await pool.query('SELECT id,name,role FROM users WHERE role=? AND pin=? AND active=TRUE AND deleted_at IS NULL', [role, req.body.pin]);
  if (!user) return res.status(401).json({ message: `Invalid ${role} portal PIN` });
  res.json(user);
}

export async function getProfile(req, res) {
  const role = req.portalSession.role;
  const userId = Number(req.headers['x-portal-user-id']);
  const [[user]] = await pool.query('SELECT id,name,role,phone,email,profile_image_url "profileImageUrl" FROM users WHERE id=? AND role=? AND active=TRUE AND deleted_at IS NULL', [userId, role]);
  if (!user) return res.status(404).json({ message: 'Your profile could not be found' });
  res.json(user);
}

export async function patchProfile(req, res) {
  const role = req.portalSession.role;
  const userId = Number(req.headers['x-portal-user-id']);
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  const email = String(req.body.email || '').trim();

  if (!userId || !name) return res.status(400).json({ message: 'Your name is required' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });

  const [[user]] = await pool.query('SELECT id,profile_image_object "profileImageObject" FROM users WHERE id=? AND role=? AND active=TRUE AND deleted_at IS NULL', [userId, role]);
  if (!user) return res.status(404).json({ message: 'Your profile could not be found' });

  let imageUrl = null, imageObject = null;
  if (req.file) {
    const ext = req.file.originalname.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const stored = await putImage(await storageOwner(), `profiles/${userId}-${crypto.randomUUID()}.${ext}`, req.file.buffer, req.file.size, req.file.mimetype);
    imageObject = stored.objectName;
    imageUrl = stored.url;
  }

  await pool.query(
    `UPDATE users SET name=?,phone=?,email=?${req.file ? ',profile_image_url=?,profile_image_object=?' : ''} WHERE id=?`,
    req.file ? [name, phone, email, imageUrl, imageObject, userId] : [name, phone, email, userId]
  );

  if (req.file && user.profileImageObject) {
    await minio.removeObject(bucket, user.profileImageObject).catch(() => {});
  }

  res.json({ id: userId, name, role, phone, email, profileImageUrl: imageUrl || undefined });
}

// Bookings
export async function createBooking(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Only Admin can create table bookings' });
  const tableId = Number(req.body.tableId);
  const bookingDate = String(req.body.bookingDate || '');
  const bookingTime = String(req.body.bookingTime || '');
  const durationMinutes = Number(req.body.durationMinutes || 90);
  const customerPhone = String(req.body.customerPhone || '').replace(/[\s()-]/g, '');
  const guestName=String(req.body.guestName||'Customer').trim(), notes=String(req.body.notes||'').trim(), guestCount=req.body.guestCount ? Number(req.body.guestCount) : null;
  if(!guestName||guestName.length>120||notes.length>1000||(guestCount!==null&&(!Number.isInteger(guestCount)||guestCount<1)))return res.status(400).json({message:'Provide a valid guest name, guest count and notes (up to 1000 characters)'});

  if (!tableId || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(bookingTime) || !Number.isInteger(durationMinutes) || durationMinutes < 30 || durationMinutes > 240 || !/^\+?\d{8,15}$/.test(customerPhone)) {
    return res.status(400).json({ message: 'Table, future date, time, 30–240 minute duration, and a valid customer phone are required' });
  }

  const conn = await pool.getConnection();
  let bookingId, message;
  try {
    await conn.beginTransaction();
    const [[table]] = await conn.query('SELECT id,table_number number,active,seats FROM restaurant_tables WHERE id=? FOR UPDATE', [tableId]);
    if (!table || !table.active) throw Object.assign(new Error('Table is not available'), { status: 404 });
    if(guestCount>table.seats)throw Object.assign(new Error('Guest count exceeds table capacity'),{status:400});
    const [[timeCheck]] = await conn.query('SELECT (?::date + ?::time) <= NOW() "inPast"', [bookingDate, bookingTime]);
    if (timeCheck.inPast) throw Object.assign(new Error('Choose a future booking date and time'), { status: 400 });
    const [[conflict]] = await conn.query("SELECT id,booking_time \"bookingTime\",duration_minutes \"durationMinutes\" FROM bookings WHERE table_id=? AND (status='confirmed' OR (status='seated' AND EXISTS(SELECT 1 FROM restaurant_tables rt WHERE rt.active_booking_id=bookings.id))) AND (booking_date::date + booking_time::time) < ((?::date + ?::time) + (?)::double precision * INTERVAL '1 minute') AND ((booking_date::date + booking_time::time) + (duration_minutes)::double precision * INTERVAL '1 minute') > (?::date + ?::time) LIMIT 1 FOR UPDATE", [tableId, bookingDate, bookingTime, durationMinutes, bookingDate, bookingTime]);
    if (conflict) throw Object.assign(new Error(`Table ${table.number} is already locked at that time`), { status: 409 });
    // Guests seated now keep the table; a booking may only start an hour or more from now on an occupied table.
    const [[busyNow]] = await conn.query("SELECT ((?::date + ?::time) < NOW() + INTERVAL '60 minutes') AND (EXISTS(SELECT 1 FROM orders WHERE table_id=? AND status NOT IN ('completed','cancelled')) OR EXISTS(SELECT 1 FROM restaurant_tables WHERE id=? AND active_booking_id IS NOT NULL)) \"busy\"", [bookingDate, bookingTime, tableId, tableId]);
    if (busyNow?.busy) throw Object.assign(new Error(`Table ${table.number} is occupied now. Choose another table or a time at least 60 minutes from now.`), { status: 409 });
    message = `KnockOUT booking confirmed: Table ${table.number} on ${bookingDate.split('-').reverse().join('-')} at ${bookingTime}, reserved for ${durationMinutes} minutes.`;
    const [result] = await conn.query("INSERT INTO bookings (table_id,guest_name,customer_phone,booking_date,booking_time,duration_minutes,status,notification_status,notification_message,guest_count,notes) VALUES (?,?,?,?,?,?,'confirmed','queued',?,?,?)", [tableId, guestName, customerPhone, bookingDate, bookingTime, durationMinutes, message,guestCount,notes]);
    bookingId = result.insertId;
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  let notification;
  try { notification = await sendBookingConfirmation(customerPhone, message); } catch (error) { notification = { status: 'failed', detail: error.message }; }
  await pool.query('UPDATE bookings SET notification_status=? WHERE id=?', [notification.status, bookingId]);
  res.status(201).json({ ok: true, id: bookingId, notificationStatus: notification.status, notificationDetail: notification.detail || '' });
}

// Orders
export async function createOrder(req, res) {
  if (req.portalSession.role !== 'waiter') return res.status(403).json({ message: 'Table orders must be created from the Waiter portal' });
  if (!req.body.items?.length) return res.status(400).json({ message: 'Add at least one food item' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[table]] = await conn.query('SELECT * FROM restaurant_tables WHERE id=? FOR UPDATE', [req.body.tableId]);
    if (!table) throw Object.assign(new Error('Table not found'), { status: 404 });
    if (table.status === 'cleaning') throw Object.assign(new Error('This table is under cleaning. Mark it Available or Reserved before ordering.'), { status: 409 });
    if (table.order_id) throw Object.assign(new Error('This table already has an active order'), { status: 400 });
    if(!table.active)throw Object.assign(new Error('Table is inactive'),{status:409});
    const activeBooking=await currentReservation(conn,table.id);
    if(activeBooking)throw Object.assign(new Error('Seat the reserved guest before ordering'),{status:409});
    let bookingId=null,guestName=req.body.guestName || table.guest_name || 'Walk-in Guest';
    if(table.active_booking_id){
      if(Number(req.body.bookingId)!==Number(table.active_booking_id))throw Object.assign(new Error('This table belongs to the seated reservation'),{status:409});
      const [[seated]]=await conn.query("SELECT id,guest_name FROM bookings WHERE id=? AND table_id=? AND status='seated' FOR UPDATE",[table.active_booking_id,table.id]);
      if(!seated)throw Object.assign(new Error('Seated reservation is no longer valid'),{status:409});
      bookingId=seated.id;guestName=seated.guest_name;
    }else if(req.body.bookingId)throw Object.assign(new Error('Check in the reservation first'),{status:409});
    const [[waiter]]=await conn.query("SELECT id,name FROM users WHERE id=? AND role='waiter' AND active=TRUE AND deleted_at IS NULL",[req.portalSession.id]);
    if(!waiter)throw Object.assign(new Error('Active waiter account required'),{status:403});
    const [result] = await conn.query("INSERT INTO orders (table_id,booking_id,guest_name,waiter,status,payment_status,created_at) VALUES (?,?,?,?,'new','unpaid',NOW())", [table.id,bookingId,guestName,waiter.name]);
    for (const item of req.body.items) {
      const qty = Math.max(1, Number(item.qty) || 1), note = item.note || '';
      const [[menu]] = await conn.query('SELECT price FROM menu_items WHERE id=? AND available=TRUE', [item.menuId]);
      if (!menu) throw new Error('Menu item unavailable');
      const [existingLines] = await conn.query(
        'SELECT id, quantity, note FROM order_items WHERE order_id=? AND menu_id=? AND batch_no=1 ORDER BY id ASC FOR UPDATE',
        [result.insertId, item.menuId]
      );
      if (existingLines.length > 0) {
        const primary = existingLines[0];
        const newQty = Number(primary.quantity) + qty;
        await conn.query('UPDATE order_items SET quantity=? WHERE id=?', [newQty, primary.id]);
      } else {
        await conn.query('INSERT INTO order_items (order_id,menu_id,quantity,note,price,batch_no) VALUES (?,?,?,?,?,1)', [result.insertId, item.menuId, qty, note, menu.price]);
      }
    }
    await conn.query("UPDATE restaurant_tables SET status='occupied',guest_name=?,booking_time='',order_id=? WHERE id=?", [guestName, result.insertId, table.id]);
    await conn.commit();
    res.status(201).json({ id: result.insertId, bill: await billFor(result.insertId) });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function addOrderItems(req, res) {
  if (req.portalSession.role !== 'waiter') return res.status(403).json({ message: 'Additional table orders must come from the Waiter portal' });
  if (!req.body.items?.length) return res.status(400).json({ message: 'Add at least one item' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query('SELECT id,status,table_id,payment_status FROM orders WHERE id=? FOR UPDATE', [req.params.id]);
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if(req.body.sessionId!==undefined&&Number(req.body.sessionId)!==order.id||req.body.tableId!==undefined&&Number(req.body.tableId)!==Number(order.table_id))throw Object.assign(new Error('Selected group does not belong to this order/table'),{status:409});
    if(order.payment_status==='paid')throw Object.assign(new Error('Paid groups cannot be changed'),{status:409});
    if (['billing_requested', 'completed', 'cancelled'].includes(order.status)) throw Object.assign(new Error('This order is already in billing'), { status: 409 });
    const [[latest]] = await conn.query('SELECT COALESCE(MAX(batch_no),0) "batchNo" FROM order_items WHERE order_id=?', [order.id]);
    const maxBatch = Number(latest.batchNo) || 1;
    // Explicit rounds can be edited only before preparation; otherwise create a fresh round.
    const batchNo = req.body.batchNo ? Number(req.body.batchNo) : maxBatch + 1;
    if (!Number.isSafeInteger(batchNo) || batchNo < 1 || batchNo > maxBatch + 1) throw Object.assign(new Error('Invalid kitchen round'), { status: 400 });
    const [roundLines] = await conn.query('SELECT production_status, handoff_status FROM order_items WHERE order_id=? AND batch_no=? FOR UPDATE', [order.id, batchNo]);
    if (roundLines.some(line => (line.production_status || 'new') !== 'new' || (line.handoff_status || 'pending') !== 'pending')) {
      throw Object.assign(new Error('Preparation has started. This round cannot be changed; add a new round instead.'), { status: 409 });
    }
    for (const item of req.body.items) {
      const qty = Math.max(1, Number(item.qty) || 1), note = item.note || '';
      const [[menu]] = await conn.query('SELECT price FROM menu_items WHERE id=? AND available=TRUE', [item.menuId]);
      if (!menu) throw Object.assign(new Error('Menu item unavailable'), { status: 400 });

      // Check if this menu item already exists in this round (batch)
      const [existingLines] = await conn.query(
        'SELECT id, quantity, note, production_status FROM order_items WHERE order_id=? AND menu_id=? AND batch_no=? ORDER BY id ASC FOR UPDATE',
        [order.id, item.menuId, batchNo]
      );

      if (existingLines.length > 0) {
        // Increase quantity of existing item in this round instead of inserting a duplicate row
        const primary = existingLines[0];
        const newQty = Number(primary.quantity) + qty;
        let combinedNote = primary.note || '';
        if (note && !combinedNote.includes(note)) {
          combinedNote = combinedNote ? `${combinedNote} · ${note}` : note;
        }
        await conn.query(
          "UPDATE order_items SET quantity=?, note=?, production_status=CASE WHEN production_status='ready' THEN 'new' ELSE production_status END, handoff_status='pending' WHERE id=?",
          [newQty, combinedNote, primary.id]
        );
        // Consolidate any duplicate lines if they existed
        for (let i = 1; i < existingLines.length; i++) {
          await conn.query('UPDATE order_items SET quantity = quantity + ? WHERE id=?', [existingLines[i].quantity, primary.id]);
          await conn.query('DELETE FROM order_items WHERE id=?', [existingLines[i].id]);
        }
      } else {
        await conn.query(
          "INSERT INTO order_items (order_id,menu_id,quantity,note,price,batch_no,production_status,handoff_status) VALUES (?,?,?,?,?,?,'new','pending')",
          [order.id, item.menuId, qty, note, menu.price, batchNo]
        );
      }
    }
    await conn.query("UPDATE orders SET status='new' WHERE id=? AND status IN ('new','preparing','ready','collected','received','served')", [order.id]);
    await conn.commit();
    res.status(201).json({ id: order.id, batchNo, bill: await billFor(order.id) });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function markOrderItemUnavailable(req, res) {
  const role = req.portalSession.role;
  if (!['admin', 'chef', 'juicer'].includes(role)) return res.status(403).json({ message: 'Chef, Juicer, or Admin access required' });
  const orderId = Number(req.params.id);
  const menuId = Number(req.params.menuId);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[item]] = await conn.query(`SELECT id,name,category,${stationSQL()} FROM menu_items WHERE id=?`, [menuId]);
    if (!item) throw Object.assign(new Error('Menu item not found'), { status: 404 });
    if (role === 'chef' && isJuiceItem(item) || role === 'juicer' && !isJuiceItem(item)) {
      throw Object.assign(new Error('Juicers can only update juice availability'), { status: 403 });
    }

    // 1. Mark menu item unavailable (out of stock)
    await conn.query('UPDATE menu_items SET available=FALSE WHERE id=?', [menuId]);

    // 2. Add [NOT AVAILABLE] note to order_items for this order (only if still in 'new' status)
    await conn.query(`UPDATE order_items SET note = CASE
      WHEN note LIKE '%[NOT AVAILABLE]%' THEN note
      WHEN note != '' THEN CONCAT(note, ' · [NOT AVAILABLE]')
      ELSE '[NOT AVAILABLE]'
    END WHERE order_id=? AND menu_id=? AND production_status='new'`, [orderId, menuId]);

    // 3. Look up order and table info for real-time notification
    const [[order]] = await conn.query('SELECT o.id,o.table_id "tableId",o.order_type "orderType",o.waiter,t.table_number "tableNumber" FROM orders o LEFT JOIN restaurant_tables t ON t.id=o.table_id WHERE o.id=?', [orderId]);

    await conn.commit();

    // Store details for WebSocket broadcast
    res.locals.broadcastDetails = {
      action: 'item_unavailable',
      orderId,
      menuId,
      itemName: item.name,
      tableNumber: order?.tableNumber || null,
      tableId: order?.tableId || null,
      waiter: order?.waiter || null,
      orderType: order?.orderType || 'dine_in'
    };

    res.json({
      ok: true,
      orderId,
      menuId,
      itemName: item.name,
      tableNumber: order?.tableNumber || null,
      tableId: order?.tableId || null,
      waiter: order?.waiter || null
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function requestBill(req,res){
 if(req.portalSession.role!=='waiter')return res.status(403).json({message:'Billing requests must come from the Waiter portal'});
 const conn=await pool.getConnection();try{await conn.beginTransaction();
 const [[order]]=await conn.query('SELECT id,table_id "tableId",status,payment_status "paymentStatus" FROM orders WHERE id=? FOR UPDATE',[req.params.id]);
 if(!order)throw Object.assign(new Error('Order not found'),{status:404});
 if(order.paymentStatus==='paid'||!['received','served','billing_requested'].includes(order.status))throw Object.assign(new Error('Confirm this group received its order before requesting the bill'),{status:409});
 await conn.query("UPDATE orders SET status='billing_requested' WHERE id=?",[order.id]);const bill=await billFor(order.id,conn);await conn.commit();res.json({ok:true,orderId:order.id,tableId:order.tableId,bill});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
}

const PAY_METHODS = ['Cash', 'Card / UPI'];
/** Reads one payment method or a Cash + Card / UPI split; a split must add up to the bill exactly. */
function paymentInput(body, total) {
  const bad = message => Object.assign(new Error(message), {status:400});
  if (Array.isArray(body?.payments) && body.payments.length) {
    const parts = body.payments.map(p => ({method:p?.method, amount:Number(p?.amount)}));
    if (parts.length !== 2 || new Set(parts.map(p => p.method)).size !== 2 || !parts.every(p => PAY_METHODS.includes(p.method))) throw bad('Split payment needs one Cash amount and one Card / UPI amount');
    if (!parts.every(p => Number.isFinite(p.amount) && p.amount > 0 && Math.abs(Math.round(p.amount * 100) - p.amount * 100) < 1e-6)) throw bad('Each split amount must be more than ₹0, with up to 2 decimals');
    const cents = parts.reduce((sum, p) => sum + Math.round(p.amount * 100), 0);
    if (cents !== Math.round(Number(total) * 100)) throw bad(`Split amounts must add up to the bill total ₹${Number(total).toFixed(2)}`);
    parts.sort((a, b) => PAY_METHODS.indexOf(a.method) - PAY_METHODS.indexOf(b.method));
    return {method:'Split', split:JSON.stringify(parts.map(p => ({method:p.method, amount:Math.round(p.amount * 100) / 100})))};
  }
  if (!body?.paymentMethod) return null;
  if (!PAY_METHODS.includes(body.paymentMethod)) throw bad('Choose Cash, Card / UPI or a split payment');
  return {method:body.paymentMethod, split:null};
}

export async function getOrderBill(req, res) {
  const [[order]] = await pool.query('SELECT o.*,(SELECT COUNT(*) FROM orders daily WHERE DATE(daily.created_at)=DATE(o.created_at) AND daily.id<=o.id) "dailyNumber" FROM orders o WHERE o.id=?', [req.params.id]);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ ...await billFor(order.id), order });
}

export async function finalizeOrder(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Only Admin can finalize payments' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[target]]=await conn.query('SELECT table_id FROM orders WHERE id=?',[req.params.id]);
    if(target?.table_id)await conn.query('SELECT id FROM restaurant_tables WHERE id=? FOR UPDATE',[target.table_id]);
    const [[order]] = await conn.query('SELECT * FROM orders WHERE id=? FOR UPDATE', [req.params.id]);
    if (!order) throw Object.assign(new Error('Order not found'), {status:404});
    let bill=await billFor(req.params.id,conn);
    if(!bill.items.length)throw Object.assign(new Error('An empty group cannot be billed. Cancel the session instead.'),{status:409});
    if (order.status === 'cancelled') throw Object.assign(new Error('Cancelled orders cannot be billed'), {status:409});
    await applyParcelCharge(conn, order, parcelChargeInput(req.body?.parcelCharge));
    if (order.status === 'completed') {
      await conn.commit();
      return res.json({id:order.id, paymentStatus:order.payment_status, paymentMethod:order.payment_method, paymentSplit:order.payment_split, billNumber:order.bill_number, billDate:order.bill_date, bill});
    }
    bill = await billFor(order.id, conn);
    const alreadyPaid = order.payment_status === 'paid', payment = alreadyPaid ? {method:order.payment_method, split:order.payment_split == null ? null : JSON.stringify(order.payment_split)} : paymentInput(req.body, bill.total);
    if (!payment?.method) throw Object.assign(new Error('Record Cash or Card / UPI payment before completing this order'), {status:400});
    const numbering = await assignDailyBillNumber(conn, order.id);
    await conn.query("UPDATE orders SET status='completed',payment_status='paid',payment_method=?,payment_split=?::jsonb,subtotal=?,tax=?,service_charge=?,total=?,completed_at=NOW() WHERE id=?", [payment.method, payment.split, bill.subtotal, bill.tax, bill.service, bill.total, order.id]);
    if (order.table_id) await syncTableSessions(conn,order.table_id,{releaseReservation:true,afterDining:true});
    await conn.commit();
    res.json({ id: order.id, paymentStatus: 'paid', paymentMethod: payment.method, paymentSplit: payment.split && JSON.parse(payment.split), ...numbering, bill });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Parcels
export async function createParcel(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Parcel orders are created by Admin' });
  if (!req.body.items?.length) return res.status(400).json({ message: 'Add at least one food item' });
  const paymentMethod = req.body.paymentMethod || null;
  if (paymentMethod && !['Cash', 'Card / UPI'].includes(paymentMethod)) return res.status(400).json({ message: 'Invalid payment method' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query("INSERT INTO orders (table_id,order_type,guest_name,customer_phone,waiter,status,payment_status,payment_method,created_at) VALUES (NULL,'parcel',?,?,?,'new',?,?,NOW())", [String(req.body.customerName || '').trim().slice(0, 120) || 'Parcel Customer', req.body.customerPhone || '', req.body.adminName || 'Admin', paymentMethod ? 'paid' : 'unpaid', paymentMethod]);
    for (const item of req.body.items) {
      const [[menu]] = await conn.query('SELECT price FROM menu_items WHERE id=? AND available=TRUE', [item.menuId]);
      if (!menu) throw new Error('Menu item unavailable');
      await conn.query('INSERT INTO order_items (order_id,menu_id,quantity,note,price) VALUES (?,?,?,?,?)', [result.insertId, item.menuId, item.qty, item.note || '', menu.price]);
    }
    if (!String(req.body.customerName || '').trim()) await conn.query('UPDATE orders SET guest_name=? WHERE id=?', [`Parcel #${result.insertId}`, result.insertId]);
    const charge = parcelChargeInput(req.body.parcelCharge);
    if (charge) await conn.query('UPDATE orders SET parcel_charge=? WHERE id=?', [charge, result.insertId]);
    const bill = await billFor(result.insertId, conn);
    if (paymentMethod) await conn.query('UPDATE orders SET subtotal=?,tax=?,service_charge=?,total=? WHERE id=?', [bill.subtotal, bill.tax, bill.service, bill.total, result.insertId]);
    await conn.commit();
    res.status(201).json({ id: result.insertId, paymentStatus: paymentMethod ? 'paid' : 'unpaid', bill });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function markOrderPaid(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Only Admin can record parcel payments' });
  if (!PAY_METHODS.includes(req.body.paymentMethod) && !(Array.isArray(req.body.payments) && req.body.payments.length)) return res.status(400).json({ message: 'Choose Cash or Card / UPI' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query('SELECT id,order_type,status,payment_status,payment_method,payment_split,parcel_charge FROM orders WHERE id=? FOR UPDATE', [req.params.id]);
    if (!order) { await conn.rollback(); return res.status(404).json({ message: 'Order not found' }); }
    if (order.order_type !== 'parcel') { await conn.rollback(); return res.status(400).json({ message: 'Advance payment is only available for parcel orders' }); }
    if (['completed','cancelled'].includes(order.status)) { await conn.rollback(); return res.status(409).json({ message: 'Parcel is already completed' }); }
    await applyParcelCharge(conn, order, parcelChargeInput(req.body?.parcelCharge));
    // A retried request after payment returns the recorded payment instead of charging again.
    if (order.payment_status === 'paid') { const bill = await billFor(order.id, conn); await conn.commit(); return res.json({ id: order.id, paymentStatus: 'paid', paymentMethod: order.payment_method, paymentSplit: order.payment_split, bill }); }
    const bill = await billFor(order.id, conn), payment = paymentInput(req.body, bill.total);
    await conn.query("UPDATE orders SET payment_status='paid',payment_method=?,payment_split=?::jsonb,subtotal=?,tax=?,service_charge=?,total=? WHERE id=?", [payment.method, payment.split, bill.subtotal, bill.tax, bill.service, bill.total, order.id]);
    await conn.commit();
    res.json({ id: order.id, paymentStatus: 'paid', paymentMethod: payment.method, paymentSplit: payment.split && JSON.parse(payment.split), bill });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Tables
export async function updateTableStatus(req, res) {
  const role = req.portalSession.role;
  if (!['admin', 'waiter'].includes(role)) return res.status(403).json({ message: 'Only Admin or Waiter can update tables' });
  const allowed = ['available', 'occupied', 'reserved', 'cleaning'], status = req.body.status;
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid table status' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[table]] = await conn.query('SELECT * FROM restaurant_tables WHERE id=? FOR UPDATE', [req.params.id]);
    if (!table) throw Object.assign(new Error('Table not found'), { status: 404 });
    if(table.active_booking_id)throw Object.assign(new Error('Finish the seated reservation before changing table status'),{status:409});
    const reservation=await currentReservation(conn,table.id);
    if (table.order_id && status !== 'occupied') throw Object.assign(new Error('Finalize the active bill before changing this table'), { status: 409 });
    if (status === 'occupied' && !table.order_id) throw Object.assign(new Error('Create an order to mark this table occupied'), { status: 409 });
    if(reservation&&status==='available'){await conn.query("UPDATE restaurant_tables SET status='reserved',booking_time=? WHERE id=?",[reservation.booking_time,table.id]);await conn.commit();return res.json({ok:true,status:'reserved'});}
    if (status === 'reserved') await conn.query("UPDATE restaurant_tables SET status='reserved',guest_name='',booking_time=? WHERE id=?", [req.body.bookingTime || table.booking_time || '', table.id]);
    else if (status === 'occupied') await conn.query("UPDATE restaurant_tables SET status='occupied' WHERE id=?", [table.id]);
    else await conn.query("UPDATE restaurant_tables SET status=?,guest_name=?,booking_time=? WHERE id=?", [status, '', '', table.id]);
    await conn.commit();
    res.json({ ok: true, status });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function createTable(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const number = Number(req.body.number), seats = Number(req.body.seats), area = String(req.body.area || '').trim();
  if (!Number.isInteger(number) || number < 1 || !Number.isInteger(seats) || seats < 1 || !area) return res.status(400).json({ message: 'Table number, seats, and service area are required' });
  const [[existing]] = await pool.query('SELECT id,active,order_id "orderId" FROM restaurant_tables WHERE table_number=?', [number]);
  if (existing?.active) return res.status(409).json({ message: `Table ${number} already exists` });
  if (existing) {
    await pool.query("UPDATE restaurant_tables SET seats=?,area=?,status='available',guest_name='',booking_time='',order_id=NULL,active=TRUE WHERE id=?", [seats, area, existing.id]);
    return res.status(201).json({ id: existing.id, restored: true });
  }
  const [result] = await pool.query("INSERT INTO restaurant_tables (table_number,seats,area,status,active) VALUES (?,?,?,'available',TRUE)", [number, seats, area]);
  res.status(201).json({ id: result.insertId });
}

export async function updateTable(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({message:'Admin access required'});
  const id=Number(req.params.id), number=Number(req.body.number), seats=Number(req.body.seats), area=typeof req.body.area==='string'?req.body.area.trim():'';
  if(!Number.isSafeInteger(id)||id<1||!Number.isInteger(number)||number<1||number>2147483647||!Number.isInteger(seats)||seats<1||seats>2147483647||!area||area.length>80) return res.status(400).json({message:'Enter a positive whole table number and seat count, and a service area of up to 80 characters'});
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[table]]=await conn.query('SELECT id,table_number,seats,area FROM restaurant_tables WHERE id=? AND active=TRUE FOR UPDATE',[id]);
    if(!table){await conn.rollback();return res.status(404).json({message:'Table not found'})}
    const previous=req.body.previous;
    if(previous&&(Number(previous.number)!==table.table_number||Number(previous.seats)!==table.seats||previous.area!==table.area)){await conn.rollback();return res.status(409).json({message:'Table details changed. Close and reopen the editor before saving'})}
    // Update metadata only: never reset orders, reservations or occupancy.
    await conn.query('UPDATE restaurant_tables SET table_number=?,seats=?,area=? WHERE id=?',[number,seats,area,id]);
    await conn.commit();res.json({ok:true,id,number,seats,area});
  }catch(error){await conn.rollback();if(error.code==='23505')return res.status(409).json({message:`Table ${number} already exists (including archived tables)`});throw error}finally{conn.release()}
}

export async function deleteTable(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[table]]=await conn.query('SELECT id,table_number number,order_id,active_booking_id FROM restaurant_tables WHERE id=? AND active=TRUE FOR UPDATE',[req.params.id]);
    if(!table)throw Object.assign(new Error('Table not found'),{status:404});
    if(table.order_id||table.active_booking_id)throw Object.assign(new Error('Finish the active order or seated reservation before deleting this table'),{status:409});
    await conn.query("UPDATE bookings SET status='cancelled' WHERE table_id=? AND status='confirmed'",[table.id]);
    await conn.query("UPDATE restaurant_tables SET active=FALSE,status='available',guest_name='',booking_time='',order_id=NULL WHERE id=?",[table.id]);
    await conn.commit();res.json({ok:true,number:table.number});
  }catch(e){await conn.rollback();throw e}finally{conn.release()}
}

// Inventory
export async function createInventoryItem(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, category = '', quantity = 0, unit, min = 0, cost = 0 } = req.body;
  if (!name || !unit || Number(quantity) < 0 || Number(min) < 0 || Number(cost) < 0) return res.status(400).json({ message: 'Name, unit, and valid quantities are required' });
  const [result] = await pool.query('INSERT INTO inventory (name,category,quantity,unit,min_quantity,cost) VALUES (?,?,?,?,?,?)', [name, category, Number(quantity), unit, Number(min), Number(cost)]);
  if (Number(quantity) > 0) await pool.query("INSERT INTO inventory_transactions (inventory_id,movement_type,quantity,unit_cost,note,created_by) VALUES (?,'purchase',?,?,?,?)", [result.insertId, Number(quantity), Number(cost), 'Opening stock', req.body.createdBy || 'Admin']);
  res.status(201).json({ id: result.insertId });
}

export async function updateInventoryItem(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, category = '', unit, min = 0, cost = 0 } = req.body;
  await pool.query('UPDATE inventory SET name=?,category=?,unit=?,min_quantity=?,cost=? WHERE id=?', [name, category, unit, Number(min), Number(cost), req.params.id]);
  res.json({ ok: true });
}

export async function addInventoryMovement(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const type = req.body.movementType, quantity = Number(req.body.quantity);
  if (!['purchase', 'usage', 'adjustment', 'waste'].includes(type) || !Number.isFinite(quantity) || quantity <= 0) return res.status(400).json({ message: 'Choose a movement type and enter a positive quantity' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[item]] = await conn.query('SELECT id,quantity,cost FROM inventory WHERE id=? FOR UPDATE', [req.params.id]);
    if (!item) throw Object.assign(new Error('Stock item not found'), { status: 404 });
    const delta = type === 'purchase' ? quantity : type === 'adjustment' ? Number(req.body.adjustmentDirection) == -1 ? -quantity : quantity : -quantity;
    const newQuantity = Number(item.quantity) + delta;
    if (newQuantity < 0) throw Object.assign(new Error('Not enough stock for this movement'), { status: 409 });
    const unitCost = req.body.unitCost === '' || req.body.unitCost == null ? Number(item.cost) : Number(req.body.unitCost);
    await conn.query('UPDATE inventory SET quantity=?,cost=(CASE WHEN ?=\'purchase\' THEN ? ELSE cost END) WHERE id=?', [newQuantity, type, unitCost, item.id]);
    await conn.query('INSERT INTO inventory_transactions (inventory_id,movement_type,quantity,unit_cost,note,created_by) VALUES (?,?,?,?,?,?)', [item.id, type, delta, unitCost, req.body.note || '', req.body.createdBy || 'Admin']);
    await conn.commit();
    res.status(201).json({ ok: true, quantity: newQuantity });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function deleteInventoryItem(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const [[used]] = await pool.query('SELECT id FROM inventory_transactions WHERE inventory_id=? LIMIT 1', [req.params.id]);
  if (used) return res.status(409).json({ message: 'Items with stock history cannot be deleted' });
  await pool.query('DELETE FROM inventory WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}

export async function createStockRequest(req, res) {
  if (req.portalSession.role !== 'chef') return res.status(403).json({ message: 'Only Chef can request kitchen stock' });
  const inventoryId = Number(req.body.inventoryId), requestedQuantity = Number(req.body.requestedQuantity), requestedBy = String(req.body.requestedBy || 'Chef').trim(), note = String(req.body.note || '').trim();
  if (!inventoryId || !Number.isFinite(requestedQuantity) || requestedQuantity <= 0 || !requestedBy) return res.status(400).json({ message: 'Choose an item and enter the quantity required' });
  const [[item]] = await pool.query('SELECT id,name,quantity,unit,min_quantity "minQuantity" FROM inventory WHERE id=?', [inventoryId]);
  if (!item) return res.status(404).json({ message: 'Stock item not found' });
  const [[existing]] = await pool.query("SELECT id FROM stock_requests WHERE inventory_id=? AND status IN ('pending','ordered') LIMIT 1", [inventoryId]);
  if (existing) return res.status(409).json({ message: `${item.name} already has an active stock request` });
  const [result] = await pool.query("INSERT INTO stock_requests (inventory_id,requested_quantity,note,requested_by,status) VALUES (?,?,?,?,'pending')", [inventoryId, requestedQuantity, note, requestedBy]);
  res.status(201).json({ id: result.insertId, itemName: item.name, currentQuantity: Number(item.quantity), unit: item.unit });
}

export async function updateStockRequestStatus(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Only Admin can manage stock requests' });
  const status = String(req.body.status || '');
  if (!['pending', 'ordered', 'resolved'].includes(status)) return res.status(400).json({ message: 'Invalid stock request status' });
  const [result] = await pool.query("UPDATE stock_requests SET status=?,resolved_at=(CASE WHEN ?='resolved' THEN NOW() ELSE NULL END) WHERE id=?", [status, status, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Stock request not found' });
  res.json({ ok: true, status });
}

// Finance
export async function createFinanceEntry(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { entryType, category, description, amount, paymentMethod = 'Cash', entryDate, reference = '', createdBy = 'Admin' } = req.body;
  if (!['income', 'expense'].includes(entryType) || !category || !description || Number(amount) <= 0 || !entryDate) return res.status(400).json({ message: 'Type, category, description, amount, and date are required' });
  const [result] = await pool.query('INSERT INTO finance_entries (entry_type,category,description,amount,payment_method,entry_date,reference,created_by) VALUES (?,?,?,?,?,?,?,?)', [entryType, category, description, Number(amount), paymentMethod, entryDate, reference, createdBy]);
  res.status(201).json({ id: result.insertId });
}

export async function deleteFinanceEntry(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  await pool.query('DELETE FROM finance_entries WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}

export async function createSupplierPurchase(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { supplierName, invoiceNumber = '', description, purchaseDate, totalAmount, paidAmount = 0, paymentMethod = 'Cash', reference = '', notes = '', createdBy = 'Admin' } = req.body;
  const total = Number(totalAmount), paid = Number(paidAmount);
  if (!supplierName || !description || !purchaseDate || total <= 0 || paid < 0 || paid > total) return res.status(400).json({ message: 'Supplier, description, date, valid total, and paid amount are required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query('INSERT INTO supplier_purchases (supplier_name,invoice_number,description,purchase_date,total_amount,notes,created_by) VALUES (?,?,?,?,?,?,?)', [supplierName, invoiceNumber, description, purchaseDate, total, notes, createdBy]);
    if (paid > 0) await conn.query('INSERT INTO supplier_payments (purchase_id,amount,payment_method,payment_date,reference,notes,created_by) VALUES (?,?,?,?,?,?,?)', [result.insertId, paid, paymentMethod, purchaseDate, reference, 'Payment recorded with purchase', createdBy]);
    await conn.commit();
    res.status(201).json({ id: result.insertId, totalAmount: total, paidAmount: paid, dueAmount: total - paid });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function createSupplierPayment(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const amount = Number(req.body.amount);
  if (amount <= 0 || !req.body.paymentDate) return res.status(400).json({ message: 'A positive payment amount and payment date are required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[purchase]] = await conn.query('SELECT id,total_amount "totalAmount" FROM supplier_purchases WHERE id=? FOR UPDATE', [req.params.id]);
    if (!purchase) throw Object.assign(new Error('Supplier purchase not found'), { status: 404 });
    const [[totals]] = await conn.query('SELECT COALESCE(SUM(amount),0) paid FROM supplier_payments WHERE purchase_id=?', [purchase.id]);
    const due = Number(purchase.totalAmount) - Number(totals.paid);
    if (amount > due) throw Object.assign(new Error(`Payment exceeds outstanding balance of ${due.toFixed(2)}`), { status: 409 });
    const [result] = await conn.query('INSERT INTO supplier_payments (purchase_id,amount,payment_method,payment_date,reference,notes,created_by) VALUES (?,?,?,?,?,?,?)', [purchase.id, amount, req.body.paymentMethod || 'Cash', req.body.paymentDate, req.body.reference || '', req.body.notes || '', req.body.createdBy || 'Admin']);
    await conn.commit();
    res.status(201).json({ id: result.insertId, paidAmount: Number(totals.paid) + amount, dueAmount: due - amount });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function deleteSupplierPurchase(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM supplier_payments WHERE purchase_id=?', [req.params.id]);
    await conn.query('DELETE FROM supplier_purchases WHERE id=?', [req.params.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Settings
export async function updateSettings(req, res) {
  if (req.portalSession?.role !== 'admin') return res.status(403).json({message:'Admin access required'});
  const body = req.body || {};
  const boolean = (key) => {
    if (body[key] === undefined) return null; // Older clients preserve branding preferences.
    if ([true,'true'].includes(body[key])) return true;
    if ([false,'false'].includes(body[key])) return false;
    throw Object.assign(new Error(`Invalid ${key}`), {status:400});
  };
  const showLogo = boolean('showLogoOnBill'), watermark = boolean('showLogoWatermark'), remove = boolean('removeLogo');
  if (!String(body.hotelName || '').trim() || String(body.hotelName).length > 120) throw Object.assign(new Error('Business name is required (maximum 120 characters)'), {status:400});
  if (req.file && remove) throw Object.assign(new Error('Choose either upload or remove logo'), {status:400});
  if (body.timezone !== undefined && body.timezone !== '') {
    try { new Intl.DateTimeFormat('en',{timeZone:body.timezone}).format(); } catch { throw Object.assign(new Error('Use a valid IANA time zone, such as Asia/Kolkata'),{status:400}); }
  }
  let uploaded;
  if (req.file) {
    if (req.file.size > 2*1024*1024) throw Object.assign(new Error('Logo must be 2 MB or smaller'), {status:413});
    const ext = imageExtension(req.file);
    if (!['png','jpg','webp'].includes(ext)) throw Object.assign(new Error('Use a PNG, JPEG or WebP logo'), {status:400});
    uploaded = await putImage(req.portalSession.companyDatabase, `restaurant-logo-${crypto.randomUUID()}.${ext}`, req.file.buffer, req.file.size, req.file.mimetype);
  }
  let connection, previous, saved;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[settings]] = await connection.query('SELECT logo_url,logo_storage_key FROM settings WHERE id=1 FOR UPDATE');
    if (!settings) throw new Error('Restaurant settings not found');
    previous = settings.logo_storage_key;
    await connection.query('UPDATE settings SET hotel_name=?,tax_rate=?,cgst_rate=?,service_charge=?,currency=?,timezone=COALESCE(?,timezone),logo_url=?,logo_storage_key=?,show_logo_on_bill=COALESCE(?,show_logo_on_bill),show_logo_watermark=COALESCE(?,show_logo_watermark) WHERE id=1',
      [body.hotelName,body.taxRate,body.cgstRate,body.serviceCharge,body.currency,body.timezone===undefined?null:body.timezone,remove?null:uploaded?.url||settings.logo_url,remove?null:uploaded?.objectName||settings.logo_storage_key,showLogo,watermark]);
    [[saved]] = await connection.query('SELECT hotel_name "hotelName",tax_rate "taxRate",cgst_rate "cgstRate",service_charge "serviceCharge",currency,timezone,logo_url "logoUrl",show_logo_on_bill "showLogoOnBill",show_logo_watermark "showLogoWatermark" FROM settings WHERE id=1');
    await connection.commit();
  } catch(error) {
    await connection?.rollback();
    if (uploaded) await minio.removeObject(bucket,uploaded.objectName).catch(()=>{});
    throw error;
  } finally { connection?.release(); }
  // Delete only this tenant's previous logo, after the new settings commit succeeds.
  if ((uploaded || remove) && previous?.startsWith(`${req.portalSession.companyDatabase}/images/restaurant-logo-`)) {
    await minio.removeObject(bucket,previous).catch(()=>console.warn('Previous restaurant logo cleanup deferred'));
  }
  res.json({ok:true,settings:saved});
}

// Attendance
export async function getAttendance(req, res) {
  const staff = await verifyPortalStaff(req.params.id, req.portalSession.role);
  if (!staff) return res.status(403).json({ message: 'This staff account does not belong to this portal' });
  const [shifts] = await pool.query('SELECT id,check_in "checkIn",check_out "checkOut",notes FROM staff_attendance WHERE user_id=? ORDER BY check_in DESC LIMIT 100', [staff.id]);
  res.json({ staff, shifts, activeShift: shifts.find(s => !s.checkOut) || null });
}

export async function checkInSelf(req, res) {
  const staff = await verifyPortalStaff(req.params.id, req.portalSession.role);
  if (!staff) return res.status(403).json({ message: 'This staff account does not belong to this portal' });
  if (req.portalSession.role === 'admin') return res.status(403).json({ message: 'Staff must check in from their own portal' });
  const [[open]] = await pool.query('SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL', [staff.id]);
  if (open) return res.status(409).json({ message: 'You are already checked in' });
  const [result] = await pool.query('INSERT INTO staff_attendance (user_id,check_in,notes) VALUES (?,NOW(),?)', [staff.id, req.body.notes || '']);
  res.status(201).json({ id: result.insertId, checkIn: new Date() });
}

export async function checkOutSelf(req, res) {
  const staff = await verifyPortalStaff(req.params.id, req.portalSession.role);
  if (!staff) return res.status(403).json({ message: 'This staff account does not belong to this portal' });
  if (req.portalSession.role === 'admin') return res.status(403).json({ message: 'Staff must check out from their own portal' });
  const [[shift]] = await pool.query('SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1', [staff.id]);
  if (!shift) return res.status(409).json({ message: 'You are not currently checked in' });
  await pool.query('UPDATE staff_attendance SET check_out=NOW(),notes=(CASE WHEN ?=\'\' THEN notes ELSE ? END) WHERE id=?', [req.body.notes || '', req.body.notes || '', shift.id]);
  res.json({ ok: true, checkOut: new Date() });
}

export async function adminCheckInStaff(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const [[staff]] = await pool.query('SELECT id FROM users WHERE id=? AND active=TRUE', [req.params.id]);
  if (!staff) return res.status(404).json({ message: 'Active staff member not found' });
  const [[open]] = await pool.query('SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL', [req.params.id]);
  if (open) return res.status(409).json({ message: 'Staff member is already checked in' });
  const [result] = await pool.query('INSERT INTO staff_attendance (user_id,check_in,notes) VALUES (?,NOW(),?)', [req.params.id, req.body.notes || '']);
  res.status(201).json({ id: result.insertId });
}

export async function adminCheckOutStaff(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const [[shift]] = await pool.query('SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1', [req.params.id]);
  if (!shift) return res.status(409).json({ message: 'No active check-in found' });
  await pool.query('UPDATE staff_attendance SET check_out=NOW(),notes=(CASE WHEN ?=\'\' THEN notes ELSE ? END) WHERE id=?', [req.body.notes || '', req.body.notes || '', shift.id]);
  res.json({ ok: true });
}

// Staff
export async function createStaff(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, role, phone = '', payType = 'monthly', payRate = 0 } = req.body;
  if (!name || !['admin', 'waiter', 'chef'].includes(role) || !['daily', 'monthly'].includes(payType)) return res.status(400).json({ message: 'Name, role, and Daily/Monthly salary basis are required' });
  if (role === 'admin') {
    const [[existing]] = await pool.query('SELECT id FROM users WHERE role=? AND deleted_at IS NULL LIMIT 1', [role]);
    if (existing) return res.status(409).json({ message: role === 'admin' ? 'This company already has its single Admin login.' : 'This company already has its single Head Chef login. Add other chefs from Chef Management without PINs.' });
  }
  const pin = await generatePortalPin();
  const [result] = await pool.query('INSERT INTO users (name,role,pin,phone,pay_type,pay_rate,active) VALUES (?,?,?,?,?,?,TRUE)', [name, role, pin, phone, payType, Number(payRate)]);
  res.status(201).json({ id: result.insertId, pin });
}

export async function updateStaff(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const [[approval]]=await pool.query('SELECT approval_status FROM users WHERE id=? AND deleted_at IS NULL',[req.params.id]);
  if(approval && approval.approval_status!=='approved')return res.status(409).json({message:'Review this staff request through Pending Approvals first'});
  const { name, role, pin, phone = '', payType = 'monthly', payRate = 0, active = true } = req.body;
  if (!['admin', 'waiter', 'chef', 'juicer'].includes(role) || !/^[0-9]{6}$/.test(String(pin || '')) || !['daily', 'monthly'].includes(payType)) return res.status(400).json({ message: 'Valid role, unique 6-digit PIN, and Daily/Monthly salary basis are required' });
  if (['admin', 'juicer'].includes(role)) {
    const [[existing]] = await pool.query('SELECT id FROM users WHERE role=? AND id<>? AND deleted_at IS NULL LIMIT 1', [role, req.params.id]);
    if (existing) return res.status(409).json({ message: `This company already has its single ${role === 'admin' ? 'Admin' : role === 'chef' ? 'Head Chef' : 'Juicer'} login.` });
  }
  const [[linkedEmployee]]=await pool.query('SELECT id FROM kitchen_staff WHERE user_id=? AND deleted_at IS NULL',[req.params.id]);
  if(linkedEmployee && role!=='chef')return res.status(409).json({message:'A linked kitchen employee must retain the Chef role'});
  const currentDatabase = String(req.headers['x-company-database'] || process.env.DB_NAME || 'knockout');
  if (active) await ensureUniquePortalPin({ pin, currentDatabase, excludeId: req.params.id });
  const conn=await pool.getConnection();try{await conn.beginTransaction();
  const [result]=await conn.query('UPDATE users SET name=?,role=?,pin=?,phone=?,pay_type=?,pay_rate=?,active=? WHERE id=? AND deleted_at IS NULL',[name,role,pin,phone,payType,Number(payRate),!!active,req.params.id]);
  if(!result.affectedRows){await conn.rollback();return res.status(404).json({message:'Staff member not found'})}
  await conn.query('UPDATE kitchen_staff SET name=?,phone=?,pay_type=?,pay_rate=?,active=?,updated_at=NOW() WHERE user_id=? AND deleted_at IS NULL',[name,phone,payType,Number(payRate),!!active,req.params.id]);
  await conn.commit();res.json({ok:true});
  }catch(e){await conn.rollback();throw e}finally{conn.release()}
}

export async function deleteStaff(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const [[staff]] = await pool.query('SELECT id,name,role,approval_status FROM users WHERE id=? AND deleted_at IS NULL', [req.params.id]);
  if(staff && staff.approval_status!=='approved')return res.status(409).json({message:'Pending and rejected requests are retained for audit'});
  if (!staff) return res.status(404).json({ message: 'Staff member not found' });
  if (staff.role === 'admin') return res.status(409).json({ message: 'The company Admin login is protected and cannot be deleted here' });
  await pool.query("WITH disabled AS (UPDATE users SET active=FALSE,deleted_at=NOW(),pin=CONCAT('deleted-',id,'-',floor(extract(epoch FROM NOW()))) WHERE id=? RETURNING id) UPDATE kitchen_staff SET active=FALSE,deleted_at=NOW() WHERE user_id IN (SELECT id FROM disabled)",[staff.id]);
  res.json({ ok: true, id: staff.id, name: staff.name, attendancePreserved: true });
}

// Juicer
export async function getJuicerLogin(req,res){
 if(req.portalSession.role!=='chef')return res.status(403).json({message:'Head Chef access required'});
 const [[juicer]]=await pool.query("SELECT id,name,role,phone,active,approval_status \"approvalStatus\" FROM users WHERE role='juicer' AND deleted_at IS NULL AND (approval_status='approved' OR requested_by=?) LIMIT 1",[req.portalSession.id]);res.json(juicer||null);
}
export async function createJuicerLogin(req,res){
 if(req.portalSession.role!=='chef')return res.status(403).json({message:'Head Chef access required'});
 const {name,phone='',payType='monthly',payRate=0}=req.body;
 if(!String(name||'').trim()||!['daily','monthly'].includes(payType)||!Number.isFinite(Number(payRate))||Number(payRate)<0)return res.status(400).json({message:'Valid name and salary required'});
 const conn=await pool.getConnection();try{await conn.beginTransaction();const chef=await actor(conn,req.portalSession);await conn.query("SELECT pg_advisory_xact_lock(821773)");
 const [[existing]]=await conn.query("SELECT id FROM users WHERE role='juicer' AND deleted_at IS NULL LIMIT 1");if(existing){await conn.rollback();return res.status(409).json({message:'This hotel already has a Juicer account or request. Contact the Admin.'})}
 const pin=await generatePortalPin();
 const [result]=await conn.query("INSERT INTO users(name,role,pin,phone,pay_type,pay_rate,active,approval_status,requested_by) VALUES(?,'juicer',?,?,?,?,FALSE,'pending',?)",[name.trim(),pin,phone.trim(),payType,Number(payRate),chef.id]);
 await conn.commit();if(res.locals)res.locals.broadcastDetails={action:'staff_requested'};res.status(201).json({id:result.insertId,approvalStatus:'pending',message:'Staff request submitted successfully. Waiting for admin approval.'});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
}

// Kitchen Staff
export async function createKitchenStaff(req,res){
 const role=req.portalSession.role;
 if(!['admin','chef'].includes(role))return res.status(403).json({message:'Admin or Head Chef access required'});
 const {name,designation='Chef',phone='',specialization='',payType='monthly',payRate=0,joinedOn=null,notes=''}=req.body;
 if(!String(name||'').trim()||!String(designation||'').trim()||!['daily','monthly'].includes(payType)||!Number.isFinite(Number(payRate))||Number(payRate)<0)return res.status(400).json({message:'Valid staff name, designation and salary required'});
 const conn=await pool.getConnection();try{await conn.beginTransaction();const creator=await actor(conn,req.portalSession);
 await conn.query('SELECT pg_advisory_xact_lock(?)',[creator.id]);
 const [[duplicate]]=await conn.query("SELECT id FROM kitchen_staff WHERE requested_by=? AND lower(btrim(name))=lower(btrim(?)) AND phone=? AND approval_status='pending' AND deleted_at IS NULL",[creator.id,name,phone]);
 if(duplicate){await conn.commit();return res.json({id:duplicate.id,approvalStatus:'pending',message:'Staff request submitted successfully. Waiting for admin approval.'})}
 const pending=role==='chef';
 const [result]=await conn.query('INSERT INTO kitchen_staff(name,designation,phone,specialization,pay_type,pay_rate,joined_on,notes,active,created_by,approval_status,requested_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[name.trim(),designation.trim(),phone.trim(),specialization.trim(),payType,Number(payRate),joinedOn||null,notes.trim(),!pending,creator.name,pending?'pending':'approved',pending?creator.id:null]);
 await conn.commit();if(pending&&res.locals)res.locals.broadcastDetails={action:'staff_requested'};res.status(201).json({id:result.insertId,approvalStatus:pending?'pending':'approved',message:pending?'Staff request submitted successfully. Waiting for admin approval.':'Staff added'});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
}
export async function updateKitchenStaff(req,res){
 if(req.portalSession.role!=='admin')return res.status(403).json({message:'Only the hotel Admin can edit or activate staff'});
 const {name,designation='Chef',phone='',specialization='',payType='monthly',payRate=0,joinedOn=null,notes='',active=true}=req.body;
 if(!String(name||'').trim()||!String(designation||'').trim()||!['daily','monthly'].includes(payType)||!Number.isFinite(Number(payRate))||Number(payRate)<0)return res.status(400).json({message:'Valid staff details required'});
 const conn=await pool.getConnection();try{await conn.beginTransaction();
 const [[member]]=await conn.query("SELECT id,user_id FROM kitchen_staff WHERE id=? AND approval_status='approved' AND deleted_at IS NULL FOR UPDATE",[req.params.id]);
 if(!member){await conn.rollback();return res.status(409).json({message:'Staff not found or requires approval'})}
 await conn.query('UPDATE kitchen_staff SET name=?,designation=?,phone=?,specialization=?,pay_type=?,pay_rate=?,joined_on=?,notes=?,active=?,updated_at=NOW() WHERE id=?',[name.trim(),designation.trim(),phone.trim(),specialization.trim(),payType,Number(payRate),joinedOn||null,notes.trim(),!!active,member.id]);
 if(member.user_id)await conn.query('UPDATE users SET name=?,phone=?,pay_type=?,pay_rate=?,active=? WHERE id=? AND deleted_at IS NULL',[name.trim(),phone.trim(),payType,Number(payRate),!!active,member.user_id]);
 await conn.commit();res.json({ok:true});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
}
export async function deleteKitchenStaff(req,res){
 if(req.portalSession.role!=='admin')return res.status(403).json({message:'Only the hotel Admin can remove staff'});
 const conn=await pool.getConnection();try{await conn.beginTransaction();
 const [[member]]=await conn.query("SELECT id,user_id FROM kitchen_staff WHERE id=? AND approval_status='approved' AND deleted_at IS NULL FOR UPDATE",[req.params.id]);
 if(!member){await conn.rollback();return res.status(409).json({message:'Staff not found or request must be reviewed first'})}
 await conn.query('UPDATE kitchen_staff SET active=FALSE,deleted_at=NOW() WHERE id=?',[member.id]);
 if(member.user_id)await conn.query("UPDATE users SET active=FALSE,deleted_at=NOW(),pin=CONCAT('deleted-',id,'-',floor(extract(epoch FROM NOW()))) WHERE id=?",[member.user_id]);
 await conn.commit();res.json({ok:true});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
}

// Menu & Combos
export async function createMenuItem(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, category, description = '', price, icon = '🍽️', available = true } = req.body;
  if (!name || !category || Number(price) < 0) return res.status(400).json({ message: 'Name, category, and valid price are required' });
  const [result] = await pool.query('INSERT INTO menu_items (name,category,description,price,icon,available,is_combo) VALUES (?,?,?,?,?,?,FALSE)', [name, category, description, Number(price), icon, !!available]);
  res.status(201).json({ id: result.insertId });
}

export async function updateMenuItem(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, category, description = '', price, icon = '🍽️', available = true } = req.body;
  await pool.query('UPDATE menu_items SET name=?,category=?,description=?,price=?,icon=?,available=? WHERE id=?', [name, category, description, Number(price), icon, !!available, req.params.id]);
  res.json({ ok: true });
}

export async function deleteMenuItem(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  await pool.query('UPDATE menu_items SET available=FALSE WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}

export async function updateMenuItemAvailability(req, res) {
  const role = req.portalSession.role;
  if (!['admin', 'chef', 'juicer'].includes(role)) return res.status(403).json({ message: 'Admin, Head Chef, or Juicer access required' });
  if (typeof req.body.available !== 'boolean') return res.status(400).json({ message: 'Availability must be true or false' });
  if (role === 'juicer') {
    const [[item]] = await pool.query(`SELECT category,${stationSQL()} FROM menu_items WHERE id=?`, [req.params.id]);
    if (!item || !isJuiceItem(item)) return res.status(403).json({ message: 'Juicer can only update juice availability' });
  }
  const [result] = await pool.query('UPDATE menu_items SET available=? WHERE id=?', [req.body.available, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Dish not found' });
  res.json({ ok: true, id: Number(req.params.id), available: req.body.available });
}

export async function createCombo(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, description = '', price, icon = '🎁', components = [] } = req.body;
  if (!name || Number(price) < 0 || !components.length) return res.status(400).json({ message: 'Combo name, price, and at least one item are required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query("INSERT INTO menu_items (name,category,description,price,icon,available,is_combo) VALUES (?,'Combo Offers',?,?,?,TRUE,TRUE)", [name, description, Number(price), icon]);
    for (const component of components) {
      const [[item]] = await conn.query('SELECT id FROM menu_items WHERE id=? AND is_combo=FALSE', [component.menuId]);
      if (!item) throw new Error('A selected combo item is invalid');
      await conn.query('INSERT INTO combo_components (combo_id,menu_id,quantity) VALUES (?,?,?)', [result.insertId, component.menuId, Math.max(1, Number(component.quantity) || 1)]);
    }
    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function updateCombo(req, res) {
  if (req.portalSession.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { name, description = '', price, icon = '🎁', components = [] } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("UPDATE menu_items SET name=?,category='Combo Offers',description=?,price=?,icon=?,available=TRUE,is_combo=TRUE WHERE id=?", [name, description, Number(price), icon, req.params.id]);
    await conn.query('DELETE FROM combo_components WHERE combo_id=?', [req.params.id]);
    for (const component of components) {
      await conn.query('INSERT INTO combo_components (combo_id,menu_id,quantity) VALUES (?,?,?)', [req.params.id, component.menuId, Math.max(1, Number(component.quantity) || 1)]);
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function uploadMenuImage(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Please select an image file' });
  const [[item]] = await pool.query('SELECT image_object "imageObject" FROM menu_items WHERE id=?', [req.params.id]);
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  const ext = req.file.originalname.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
  const stored = await putImage(await storageOwner(), `menu/${req.params.id}-${crypto.randomUUID()}.${ext}`, req.file.buffer, req.file.size, req.file.mimetype);
  if (item.imageObject) await minio.removeObject(bucket, item.imageObject).catch(() => {});
  await pool.query('UPDATE menu_items SET image_url=?,image_object=? WHERE id=?', [stored.url, stored.objectName, req.params.id]);
  res.json({ imageUrl: stored.url, objectName: stored.objectName });
}

export async function deleteMenuImage(req, res) {
  const [[item]] = await pool.query('SELECT image_object "imageObject" FROM menu_items WHERE id=?', [req.params.id]);
  if (item?.imageObject) await minio.removeObject(bucket, item.imageObject);
  await pool.query('UPDATE menu_items SET image_url=NULL,image_object=NULL WHERE id=?', [req.params.id]);
  res.json({ ok: true });
}

export async function uploadReport(req, res) {
  if (!req.body.filename || typeof req.body.content !== 'string') return res.status(400).json({ message: 'Report filename and content are required' });
  const stored = await putReport(await storageOwner(), req.body.filename, req.body.content, req.body.contentType || 'text/csv;charset=utf-8');
  res.status(201).json({ ...stored, provider: storageProvider });
}
