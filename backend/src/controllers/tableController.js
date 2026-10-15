import { pool } from '../database.js';

export const createTable = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const number = Number(req.body.number);
  const seats = Number(req.body.seats);
  const area = String(req.body.area || '').trim();
  if (!Number.isInteger(number) || number < 1 || !Number.isInteger(seats) || seats < 1 || !area)
    return res.status(400).json({ message: 'Table number, seats, and service area are required' });
  const [[existing]] = await pool.query(
    'SELECT id,active,order_id "orderId" FROM restaurant_tables WHERE table_number=?',
    [number]
  );
  if (existing?.active) return res.status(409).json({ message: `Table ${number} already exists` });
  if (existing) {
    await pool.query(
      "UPDATE restaurant_tables SET seats=?,area=?,status='available',guest_name='',booking_time='',order_id=NULL,active=TRUE WHERE id=?",
      [seats, area, existing.id]
    );
    return res.status(201).json({ id: existing.id, restored: true });
  }
  const [result] = await pool.query(
    "INSERT INTO restaurant_tables (table_number,seats,area,status,active) VALUES (?,?,?,'available',TRUE)",
    [number, seats, area]
  );
  res.status(201).json({ id: result.insertId });
};

export const deleteTable = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const [[table]] = await pool.query(
    'SELECT id,table_number number,order_id "orderId" FROM restaurant_tables WHERE id=? AND active=TRUE',
    [req.params.id]
  );
  if (!table) return res.status(404).json({ message: 'Table not found' });
  if (table.orderId) return res.status(409).json({ message: 'Finalize the active bill before deleting this table' });
  await pool.query("UPDATE bookings SET status='cancelled' WHERE table_id=? AND status='confirmed'", [table.id]);
  await pool.query(
    "UPDATE restaurant_tables SET active=FALSE,status='available',guest_name='',booking_time='',order_id=NULL WHERE id=?",
    [table.id]
  );
  res.json({ ok: true, number: table.number });
};

export const updateTableStatus = async (req, res) => {
  const { portalRole } = req;
  if (!['admin', 'waiter'].includes(portalRole))
    return res.status(403).json({ message: 'Only Admin or Waiter can update tables' });
  const allowed = ['available', 'occupied', 'reserved', 'cleaning'];
  const status = req.body.status;
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid table status' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[table]] = await conn.query(
      'SELECT * FROM restaurant_tables WHERE id=? FOR UPDATE',
      [req.params.id]
    );
    if (!table) throw Object.assign(new Error('Table not found'), { status: 404 });
    if (table.order_id && status !== 'occupied')
      throw Object.assign(new Error('Finalize the active bill before changing this table'), { status: 409 });
    if (status === 'occupied' && !table.order_id)
      throw Object.assign(new Error('Create an order to mark this table occupied'), { status: 409 });
    if (status === 'reserved')
      await conn.query(
        "UPDATE restaurant_tables SET status='reserved',guest_name='',booking_time=? WHERE id=?",
        [req.body.bookingTime || table.booking_time || '', table.id]
      );
    else if (status === 'occupied')
      await conn.query("UPDATE restaurant_tables SET status='occupied' WHERE id=?", [table.id]);
    else
      await conn.query(
        "UPDATE restaurant_tables SET status=?,guest_name=?,booking_time=? WHERE id=?",
        [status, '', '', table.id]
      );
    await conn.commit();
    res.json({ ok: true, status });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};
