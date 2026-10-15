import { pool } from '../database.js';

async function billFor(orderId, conn = pool) {
  const [items] = await conn.query(
    'SELECT oi.menu_id "menuId",oi.quantity qty,oi.note,oi.price,m.name,m.icon,m.image_url "imageUrl" FROM order_items oi JOIN menu_items m ON m.id=oi.menu_id WHERE oi.order_id=?',
    [orderId]
  );
  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const tax = 0, cgst = 0, service = 0;
  return { items: items.map(i => ({ ...i, price: Number(i.price) })), subtotal, tax, cgst, service, total: subtotal };
}

export const createParcel = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin')
    return res.status(403).json({ message: 'Parcel orders are created by Admin' });
  if (!req.body.items?.length)
    return res.status(400).json({ message: 'Add at least one food item' });
  const paymentMethod = req.body.paymentMethod || null;
  if (paymentMethod && !['Cash', 'Card / UPI'].includes(paymentMethod))
    return res.status(400).json({ message: 'Invalid payment method' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO orders (table_id,order_type,guest_name,customer_phone,waiter,status,payment_status,payment_method,created_at) VALUES (NULL,'parcel',?,?,?,'new',?,?,NOW())",
      [req.body.customerName || 'Parcel Customer', req.body.customerPhone || '', req.body.adminName || 'Admin', paymentMethod ? 'paid' : 'unpaid', paymentMethod]
    );
    for (const item of req.body.items) {
      const [[menu]] = await conn.query('SELECT price FROM menu_items WHERE id=? AND available=TRUE', [item.menuId]);
      if (!menu) throw new Error('Menu item unavailable');
      await conn.query(
        'INSERT INTO order_items (order_id,menu_id,quantity,note,price) VALUES (?,?,?,?,?)',
        [result.insertId, item.menuId, item.qty, item.note || '', menu.price]
      );
    }
    const bill = await billFor(result.insertId, conn);
    if (paymentMethod)
      await conn.query(
        'UPDATE orders SET subtotal=?,tax=?,service_charge=?,total=? WHERE id=?',
        [bill.subtotal, bill.tax, bill.service, bill.total, result.insertId]
      );
    await conn.commit();
    res.status(201).json({ id: result.insertId, paymentStatus: paymentMethod ? 'paid' : 'unpaid', bill });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

export const markParcelPaid = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin')
    return res.status(403).json({ message: 'Only Admin can record parcel payments' });
  if (!['Cash', 'Card / UPI'].includes(req.body.paymentMethod))
    return res.status(400).json({ message: 'Choose Cash or Card / UPI' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query(
      'SELECT id,order_type,status,payment_status FROM orders WHERE id=? FOR UPDATE',
      [req.params.id]
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.order_type !== 'parcel')
      return res.status(400).json({ message: 'Advance payment is only available for parcel orders' });
    if (order.status === 'completed')
      return res.status(409).json({ message: 'Parcel is already completed' });
    const bill = await billFor(order.id, conn);
    await conn.query(
      "UPDATE orders SET payment_status='paid',payment_method=?,subtotal=?,tax=?,service_charge=?,total=? WHERE id=?",
      [req.body.paymentMethod, bill.subtotal, bill.tax, bill.service, bill.total, order.id]
    );
    await conn.commit();
    res.json({ id: order.id, paymentStatus: 'paid', paymentMethod: req.body.paymentMethod, bill });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};
