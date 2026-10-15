import { pool } from '../database.js';

export const createBooking = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin')
    return res.status(403).json({ message: 'Only Admin can create table bookings' });
  const tableId = Number(req.body.tableId);
  const bookingDate = String(req.body.bookingDate || '');
  const bookingTime = String(req.body.bookingTime || '');
  const durationMinutes = Number(req.body.durationMinutes || 90);
  const customerPhone = String(req.body.customerPhone || '').replace(/[\s()-]/g, '');
  if (
    !tableId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(bookingTime) ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 30 ||
    durationMinutes > 240 ||
    !/^\+?\d{8,15}$/.test(customerPhone)
  )
    return res.status(400).json({ message: 'Table, future date, time, 30–240 minute duration, and a valid customer phone are required' });

  const conn = await pool.getConnection();
  let bookingId, message;
  try {
    await conn.beginTransaction();
    const [[table]] = await conn.query(
      'SELECT id,table_number number,active FROM restaurant_tables WHERE id=? FOR UPDATE',
      [tableId]
    );
    if (!table || !table.active) throw Object.assign(new Error('Table is not available'), { status: 404 });
    const [[timeCheck]] = await conn.query(
      "SELECT (?::date + ?::time) <= NOW() \"inPast\"",
      [bookingDate, bookingTime]
    );
    if (timeCheck.inPast) throw Object.assign(new Error('Choose a future booking date and time'), { status: 400 });
    const [[conflict]] = await conn.query(
      "SELECT id,booking_time \"bookingTime\",duration_minutes \"durationMinutes\" FROM bookings WHERE table_id=? AND booking_date=? AND status='confirmed' AND (booking_date::date + booking_time::time) < ((?::date + ?::time) + (?)::double precision * INTERVAL '1 minute') AND ((booking_date::date + booking_time::time) + (duration_minutes)::double precision * INTERVAL '1 minute') > (?::date + ?::time) LIMIT 1 FOR UPDATE",
      [tableId, bookingDate, bookingDate, bookingTime, durationMinutes, bookingDate, bookingTime]
    );
    if (conflict) throw Object.assign(new Error(`Table ${table.number} is already locked at that time`), { status: 409 });
    message = `KnockOUT booking confirmed: Table ${table.number} on ${bookingDate.split('-').reverse().join('-')} at ${bookingTime}, reserved for ${durationMinutes} minutes.`;
    const [result] = await conn.query(
      "INSERT INTO bookings (table_id,guest_name,customer_phone,booking_date,booking_time,duration_minutes,status,notification_status,notification_message) VALUES (?,'Customer',?,?,?,?,'confirmed','queued',?)",
      [tableId, customerPhone, bookingDate, bookingTime, durationMinutes, message]
    );
    bookingId = result.insertId;
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

  let notification;
  try { notification = await sendBookingConfirmation(customerPhone, message); }
  catch (error) { notification = { status: 'failed', detail: error.message }; }
  await pool.query('UPDATE bookings SET notification_status=? WHERE id=?', [notification.status, bookingId]);
  res.status(201).json({ ok: true, id: bookingId, notificationStatus: notification.status, notificationDetail: notification.detail || '' });
};

export const cancelBooking = async (req, res) => {
  const { portalRole } = req;
  if (portalRole !== 'admin')
    return res.status(403).json({ message: 'Only Admin can cancel table bookings' });
  const [result] = await pool.query(
    "UPDATE bookings SET status='cancelled' WHERE id=? AND status='confirmed'",
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Active booking not found' });
  res.json({ ok: true });
};

async function sendBookingConfirmation(phone, message) {
  const url = String(process.env.SMS_WEBHOOK_URL || '').trim();
  if (!url) return { status: 'queued', detail: 'SMS gateway is not configured' };
  const headers = { 'content-type': 'application/json' };
  if (process.env.SMS_WEBHOOK_TOKEN) headers.authorization = `Bearer ${process.env.SMS_WEBHOOK_TOKEN}`;
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ to: phone, message, channel: 'sms', source: 'KnockOUT' }) });
  if (!response.ok) throw new Error(`SMS gateway returned ${response.status}`);
  return { status: 'sent' };
}
