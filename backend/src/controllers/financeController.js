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

export const postFinance = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const {
    entryType,
    category,
    description,
    amount,
    paymentMethod = "Cash",
    entryDate,
    reference = "",
    createdBy = "Admin",
  } = req.body;
  if (
    !["income", "expense"].includes(entryType) ||
    !category ||
    !description ||
    Number(amount) <= 0 ||
    !entryDate
  )
    return res.status(400).json({
      message: "Type, category, description, amount, and date are required",
    });
  const [result] = await pool.query(
    "INSERT INTO finance_entries (entry_type,category,description,amount,payment_method,entry_date,reference,created_by) VALUES (?,?,?,?,?,?,?,?)",
    [
      entryType,
      category,
      description,
      Number(amount),
      paymentMethod,
      entryDate,
      reference,
      createdBy,
    ],
  );
  res.status(201).json({ id: result.insertId });
});

export const deleteFinanceid = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  await pool.query("DELETE FROM finance_entries WHERE id=?", [req.params.id]);
  res.json({ ok: true });
});
