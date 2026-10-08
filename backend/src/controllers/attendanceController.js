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

export const getAttendanceid = asyncRoute(async (req, res) => {
  const staff = await verifyPortalStaff(req.params.id);
  if (!staff)
    return res
      .status(403)
      .json({ message: "This staff account does not belong to this portal" });
  const [shifts] = await pool.query(
    "SELECT id,check_in checkIn,check_out checkOut,notes FROM staff_attendance WHERE user_id=? ORDER BY check_in DESC LIMIT 100",
    [staff.id],
  );
  res.json({
    staff,
    shifts,
    activeShift: shifts.find((s) => !s.checkOut) || null,
  });
});

export const postAttendanceidcheckin = asyncRoute(async (req, res) => {
  const staff = await verifyPortalStaff(req.params.id);
  if (!staff)
    return res
      .status(403)
      .json({ message: "This staff account does not belong to this portal" });
  if (portalRole === "admin")
    return res
      .status(403)
      .json({ message: "Staff must check in from their own portal" });
  const [[open]] = await pool.query(
    "SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL",
    [staff.id],
  );
  if (open)
    return res.status(409).json({ message: "You are already checked in" });
  const [result] = await pool.query(
    "INSERT INTO staff_attendance (user_id,check_in,notes) VALUES (?,NOW(),?)",
    [staff.id, req.body.notes || ""],
  );
  res.status(201).json({ id: result.insertId, checkIn: new Date() });
});

export const postAttendanceidcheckout = asyncRoute(async (req, res) => {
  const staff = await verifyPortalStaff(req.params.id);
  if (!staff)
    return res
      .status(403)
      .json({ message: "This staff account does not belong to this portal" });
  if (portalRole === "admin")
    return res
      .status(403)
      .json({ message: "Staff must check out from their own portal" });
  const [[shift]] = await pool.query(
    "SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
    [staff.id],
  );
  if (!shift)
    return res
      .status(409)
      .json({ message: "You are not currently checked in" });
  await pool.query(
    'UPDATE staff_attendance SET check_out=NOW(),notes=IF(?="",notes,?) WHERE id=?',
    [req.body.notes || "", req.body.notes || "", shift.id],
  );
  res.json({ ok: true, checkOut: new Date() });
});
