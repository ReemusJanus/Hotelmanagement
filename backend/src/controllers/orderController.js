import { pool } from '../database.js';

async function billFor(orderId, conn = pool) {
  const [[settings]] = await conn.query(
    'SELECT tax_rate "taxRate",cgst_rate "cgstRate",service_charge "serviceCharge" FROM settings WHERE id=1'
  );
  const [items] = await conn.query(
    'SELECT oi.menu_id "menuId",oi.quantity qty,oi.note,oi.price,m.name,m.icon,m.image_url "imageUrl" FROM order_items oi JOIN menu_items m ON m.id=oi.menu_id WHERE oi.order_id=?',
    [orderId]
  );
  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  // GST charges are temporarily disabled. Retain these calculations for later use.
  // const tax=subtotal*Number(settings.taxRate)/100;
  // const cgst=subtotal*Number(settings.cgstRate)/100;
  // const service=subtotal*Number(settings.serviceCharge)/100;
  const tax = 0, cgst = 0, service = 0;
  return { items: items.map(i => ({ ...i, price: Number(i.price) })), subtotal, tax, cgst, service, total: subtotal };
}

async function refreshOrderProductionStatus(orderId, conn = pool) {
  const [lines] = await conn.query(
    'SELECT production_status "itemStatus" FROM order_items WHERE order_id=?',
    [orderId]
  );
  if (!lines.length) return 'new';
  const next = lines.every(line => line.itemStatus === 'ready')
    ? 'ready'
    : lines.every(line => line.itemStatus === 'new') ? 'new' : 'preparing';
  await conn.query(
    "UPDATE orders SET status=? WHERE id=? AND status IN ('new','preparing','ready')",
    [next, orderId]
  );
  return next;
}

const isJuiceCategory = category => String(category || '').trim().toLowerCase() === 'juices';

export const createOrder = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'waiter')
    return res.status(403).json({ message: 'Table orders must be created from the Waiter portal' });
  if (!req.body.items?.length)
    return res.status(400).json({ message: 'Add at least one food item' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[table]] = await conn.query(
      'SELECT * FROM restaurant_tables WHERE id=? FOR UPDATE',
      [req.body.tableId]
    );
    if (!table) throw Object.assign(new Error('Table not found'), { status: 404 });
    if (table.status === 'cleaning')
      throw Object.assign(new Error('This table is under cleaning. Mark it Available or Reserved before ordering.'), { status: 409 });
    if (table.order_id)
      throw Object.assign(new Error('This table already has an active order'), { status: 400 });
    const [[activeBooking]] = await conn.query(
      "SELECT id FROM bookings WHERE table_id=? AND status='confirmed' AND NOW() >= (booking_date::date + booking_time::time) AND NOW() < ((booking_date::date + booking_time::time) + (duration_minutes)::double precision * INTERVAL '1 minute') LIMIT 1 FOR UPDATE",
      [table.id]
    );
    if (activeBooking)
      throw Object.assign(new Error('This table is locked for a confirmed reservation at the current time'), { status: 409 });
    const [result] = await conn.query(
      "INSERT INTO orders (table_id,guest_name,waiter,status,payment_status,created_at) VALUES (?,?,?,'new','unpaid',NOW())",
      [table.id, req.body.guestName || table.guest_name || 'Walk-in Guest', req.body.waiter || 'Waiter']
    );
    for (const item of req.body.items) {
      const [[menu]] = await conn.query(
        'SELECT price FROM menu_items WHERE id=? AND available=TRUE',
        [item.menuId]
      );
      if (!menu) throw new Error('Menu item unavailable');
      await conn.query(
        'INSERT INTO order_items (order_id,menu_id,quantity,note,price) VALUES (?,?,?,?,?)',
        [result.insertId, item.menuId, item.qty, item.note || '', menu.price]
      );
    }
    await conn.query(
      "UPDATE restaurant_tables SET status='occupied',guest_name=?,booking_time='',order_id=? WHERE id=?",
      [req.body.guestName || table.guest_name || 'Walk-in Guest', result.insertId, table.id]
    );
    await conn.commit();
    res.status(201).json({ id: result.insertId, bill: await billFor(result.insertId) });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

export const addOrderItems = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'waiter')
    return res.status(403).json({ message: 'Additional table orders must come from the Waiter portal' });
  if (!req.body.items?.length)
    return res.status(400).json({ message: 'Add at least one item' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query(
      'SELECT id,status FROM orders WHERE id=? FOR UPDATE',
      [req.params.id]
    );
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (['billing_requested', 'completed'].includes(order.status))
      throw Object.assign(new Error('This order is already in billing'), { status: 409 });
    const [[latest]] = await conn.query(
      'SELECT COALESCE(MAX(batch_no),0) "batchNo" FROM order_items WHERE order_id=?',
      [order.id]
    );
    const batchNo = Number(latest.batchNo) + 1;
    for (const item of req.body.items) {
      const qty = Math.max(1, Number(item.qty) || 1), note = item.note || '';
      const [[menu]] = await conn.query(
        'SELECT price FROM menu_items WHERE id=? AND available=TRUE',
        [item.menuId]
      );
      if (!menu) throw Object.assign(new Error('Menu item unavailable'), { status: 400 });
      await conn.query(
        'INSERT INTO order_items (order_id,menu_id,quantity,note,price,batch_no) VALUES (?,?,?,?,?,?)',
        [order.id, item.menuId, qty, note, menu.price, batchNo]
      );
    }
    await conn.query("UPDATE orders SET status='new' WHERE id=?", [order.id]);
    await conn.commit();
    res.status(201).json({ id: order.id, batchNo, bill: await billFor(order.id) });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

export const updateItemsStatus = async (req, res) => {
  const { portalRole } = req;
  if (!['chef', 'juicer'].includes(portalRole))
    return res.status(403).json({ message: 'Chef or Juicer access required' });
  const status = req.body.status;
  const batchNo = Math.max(1, Number(req.body.batchNo) || 1);
  if (!['new', 'preparing', 'ready'].includes(status))
    return res.status(400).json({ message: 'Invalid preparation status' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [lines] = await conn.query(
      'SELECT oi.id,m.category FROM order_items oi JOIN menu_items m ON m.id=oi.menu_id WHERE oi.order_id=? AND oi.batch_no=? FOR UPDATE',
      [req.params.id, batchNo]
    );
    const ids = lines
      .filter(line => portalRole === 'juicer' ? isJuiceCategory(line.category) : !isJuiceCategory(line.category))
      .map(line => line.id);
    if (!ids.length)
      throw Object.assign(new Error(`This kitchen batch has no ${portalRole === 'juicer' ? 'juice' : 'food'} items`), { status: 404 });
    await conn.query(
      `UPDATE order_items SET production_status=? WHERE id IN (${ids.map(() => '?').join(',')})`,
      [status, ...ids]
    );
    const orderStatus = await refreshOrderProductionStatus(req.params.id, conn);
    await conn.commit();
    res.json({ ok: true, status, orderStatus, batchNo, updatedItems: ids.length });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

export const batchHandoff = async (req, res) => {
  const { portalRole } = req;
  const status = req.body.status;
  const batchNo = Math.max(1, Number(req.params.batchNo) || 1);
  const requiredRole = status === 'collected' ? 'chef' : status === 'received' ? 'waiter' : '';
  if (!requiredRole) return res.status(400).json({ message: 'Invalid round handoff status' });
  if (portalRole !== requiredRole)
    return res.status(403).json({ message: status === 'collected' ? 'Only the Chef can confirm collection' : 'Only the Waiter can confirm receipt at the table' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query(
      'SELECT id,order_type "orderType" FROM orders WHERE id=? FOR UPDATE',
      [req.params.id]
    );
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (order.orderType === 'parcel')
      throw Object.assign(new Error('Parcel orders use the Admin handoff flow'), { status: 409 });
    const [lines] = await conn.query(
      'SELECT id,production_status "itemStatus",handoff_status "handoffStatus" FROM order_items WHERE order_id=? AND batch_no=? FOR UPDATE',
      [order.id, batchNo]
    );
    if (!lines.length) throw Object.assign(new Error('Kitchen round not found'), { status: 404 });
    if (status === 'collected' && !lines.every(line => line.itemStatus === 'ready'))
      throw Object.assign(new Error('Wait until every item in this round is ready'), { status: 409 });
    if (status === 'received' && !lines.every(line => ['collected', 'received'].includes(line.handoffStatus)))
      throw Object.assign(new Error('The Chef must confirm this round was collected first'), { status: 409 });
    await conn.query(
      'UPDATE order_items SET handoff_status=? WHERE order_id=? AND batch_no=?',
      [status, order.id, batchNo]
    );
    const [allLines] = await conn.query(
      'SELECT production_status "itemStatus",handoff_status "handoffStatus" FROM order_items WHERE order_id=?',
      [order.id]
    );
    const orderStatus = allLines.every(line => line.handoffStatus === 'received') ? 'received'
      : allLines.every(line => line.itemStatus === 'ready') ? 'ready'
        : allLines.every(line => line.itemStatus === 'new') ? 'new' : 'preparing';
    await conn.query(
      "UPDATE orders SET status=? WHERE id=? AND status NOT IN ('billing_requested','completed')",
      [orderStatus, order.id]
    );
    await conn.commit();
    res.json({ ok: true, status, batchNo, orderStatus });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

export const updateOrderStatus = async (req, res) => {
  const { portalRole } = req;
  const next = req.body.status;
  if (!['collected', 'received'].includes(next))
    return res.status(400).json({ message: 'Invalid service handoff status' });
  const requiredRole = next === 'collected' ? 'chef' : 'waiter';
  if (portalRole !== requiredRole)
    return res.status(403).json({ message: next === 'collected' ? 'Only the Chef can confirm collection from the kitchen' : 'Only the Waiter can confirm receipt at the table' });
  const [[order]] = await pool.query(
    'SELECT id,order_type "orderType",status FROM orders WHERE id=?',
    [req.params.id]
  );
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.orderType === 'parcel') return res.status(409).json({ message: 'Parcel orders use the Admin handoff flow' });
  const expected = next === 'collected' ? 'ready' : 'collected';
  if (order.status !== expected)
    return res.status(409).json({ message: next === 'collected' ? 'Wait until all food and juice items are ready' : 'The Chef must confirm collection from the kitchen first' });
  await pool.query('UPDATE orders SET status=? WHERE id=?', [next, order.id]);
  res.json({ ok: true, status: next });
};

export const requestBill = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'waiter')
    return res.status(403).json({ message: 'Billing requests must come from the Waiter portal' });
  const [[order]] = await pool.query(
    'SELECT id,table_id "tableId",status,payment_status "paymentStatus" FROM orders WHERE id=?',
    [req.params.id]
  );
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.paymentStatus === 'paid' || order.status === 'completed')
    return res.status(409).json({ message: 'This order is already completed' });
  if (!['received', 'served', 'billing_requested'].includes(order.status))
    return res.status(409).json({ message: 'Confirm that the order was received at the table first' });
  await pool.query("UPDATE orders SET status='billing_requested' WHERE id=?", [order.id]);
  res.json({ ok: true, orderId: order.id, tableId: order.tableId, bill: await billFor(order.id) });
};

export const getOrderBill = async (req, res) => {
  const [[order]] = await pool.query(
    'SELECT o.*,(SELECT COUNT(*) FROM orders daily WHERE DATE(daily.created_at)=DATE(o.created_at) AND daily.id<=o.id) "dailyNumber" FROM orders o WHERE o.id=?',
    [req.params.id]
  );
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ ...await billFor(order.id), order });
};

export const finalizeOrder = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin')
    return res.status(403).json({ message: 'Only Admin can finalize payments' });
  const bill = await billFor(req.params.id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query('SELECT * FROM orders WHERE id=? FOR UPDATE', [req.params.id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const alreadyPaid = order.payment_status === 'paid';
    const paymentMethod = alreadyPaid ? order.payment_method : (req.body.paymentMethod || null);
    if (!paymentMethod)
      return res.status(400).json({ message: 'Record Cash or Card / UPI payment before completing this order' });
    await conn.query(
      "UPDATE orders SET status='completed',payment_status='paid',payment_method=?,subtotal=?,tax=?,service_charge=?,total=?,completed_at=NOW() WHERE id=?",
      [paymentMethod, bill.subtotal, bill.tax, bill.service, bill.total, order.id]
    );
    if (order.table_id)
      await conn.query(
        "UPDATE restaurant_tables SET status='cleaning',guest_name='',booking_time='',order_id=NULL WHERE id=?",
        [order.table_id]
      );
    await conn.commit();
    res.json({ id: order.id, paymentStatus: 'paid', paymentMethod, bill });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};
