import {
  pool,
  migrate,
  getState,
  runWithTenant,
} from "../database/database.js";
import {
  minio,
  bucket,
  initializeStorage,
  publicUrl,
} from "../database/storage.js";
import { asyncRoute } from "../middleware/asyncRoute.js";

async function billFor(orderId, conn = pool) {
  const [[settings]] = await conn.query(
    "SELECT tax_rate taxRate,service_charge serviceCharge FROM settings WHERE id=1",
  );
  const [items] = await conn.query(
    "SELECT oi.menu_id menuId,oi.quantity qty,oi.note,oi.price,m.name,m.icon,m.image_url imageUrl FROM order_items oi JOIN menu_items m ON m.id=oi.menu_id WHERE oi.order_id=?",
    [orderId],
  );
  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.qty, 0),
    tax = (subtotal * Number(settings.taxRate)) / 100,
    service = (subtotal * Number(settings.serviceCharge)) / 100;
  return {
    items: items.map((i) => ({ ...i, price: Number(i.price) })),
    subtotal,
    tax,
    service,
    total: subtotal + tax + service,
  };
}

const portalRole = process.env.PORTAL_ROLE || "admin";

async function verifyPortalStaff(userId) {
  const [[staff]] = await pool.query(
    "SELECT id,name,role FROM users WHERE id=? AND active=1",
    [userId],
  );
  if (!staff) return null;
  if (portalRole !== "admin" && staff.role !== portalRole) return null;
  return staff;
}

export const postBookings = asyncRoute(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[table]] = await conn.query(
      "SELECT * FROM restaurant_tables WHERE id=? FOR UPDATE",
      [req.body.tableId],
    );
    if (!table || table.status !== "available")
      return res.status(400).json({ message: "Table is not available" });
    await conn.query(
      "INSERT INTO bookings (table_id,guest_name,booking_time) VALUES (?,?,?)",
      [req.body.tableId, req.body.guestName, req.body.bookingTime],
    );
    await conn.query(
      "UPDATE restaurant_tables SET status='reserved',guest_name=?,booking_time=? WHERE id=?",
      [req.body.guestName, req.body.bookingTime, req.body.tableId],
    );
    await conn.commit();
    res.status(201).json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});
