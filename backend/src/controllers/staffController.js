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

export const postStaff = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const {
    name,
    role,
    pin,
    phone = "",
    payType = "monthly",
    payRate = 0,
  } = req.body;
  if (
    !name ||
    !["admin", "waiter", "chef"].includes(role) ||
    !/^[0-9]{4,8}$/.test(pin)
  )
    return res
      .status(400)
      .json({ message: "Name, role, and a 4–8 digit PIN are required" });
  const [[used]] = await pool.query(
    "SELECT id FROM users WHERE role=? AND pin=? AND active=1",
    [role, pin],
  );
  if (used)
    return res
      .status(409)
      .json({ message: `This PIN is already used by another ${role}` });
  const [result] = await pool.query(
    "INSERT INTO users (name,role,pin,phone,pay_type,pay_rate,active) VALUES (?,?,?,?,?,?,TRUE)",
    [name, role, pin, phone, payType, Number(payRate)],
  );
  res.status(201).json({ id: result.insertId });
});

export const putStaffid = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const {
    name,
    role,
    pin,
    phone = "",
    payType = "monthly",
    payRate = 0,
    active = true,
  } = req.body;
  const [[used]] = await pool.query(
    "SELECT id FROM users WHERE role=? AND pin=? AND id<>? AND active=1",
    [role, pin, req.params.id],
  );
  if (used)
    return res
      .status(409)
      .json({ message: `This PIN is already used by another ${role}` });
  await pool.query(
    "UPDATE users SET name=?,role=?,pin=?,phone=?,pay_type=?,pay_rate=?,active=? WHERE id=?",
    [name, role, pin, phone, payType, Number(payRate), !!active, req.params.id],
  );
  res.json({ ok: true });
});

export const postStaffidcheckin = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const [[staff]] = await pool.query(
    "SELECT id FROM users WHERE id=? AND active=1",
    [req.params.id],
  );
  if (!staff)
    return res.status(404).json({ message: "Active staff member not found" });
  const [[open]] = await pool.query(
    "SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL",
    [req.params.id],
  );
  if (open)
    return res
      .status(409)
      .json({ message: "Staff member is already checked in" });
  const [result] = await pool.query(
    "INSERT INTO staff_attendance (user_id,check_in,notes) VALUES (?,NOW(),?)",
    [req.params.id, req.body.notes || ""],
  );
  res.status(201).json({ id: result.insertId });
});

export const postStaffidcheckout = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const [[shift]] = await pool.query(
    "SELECT id FROM staff_attendance WHERE user_id=? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
    [req.params.id],
  );
  if (!shift)
    return res.status(409).json({ message: "No active check-in found" });
  await pool.query(
    'UPDATE staff_attendance SET check_out=NOW(),notes=IF(?="",notes,?) WHERE id=?',
    [req.body.notes || "", req.body.notes || "", shift.id],
  );
  res.json({ ok: true });
});
