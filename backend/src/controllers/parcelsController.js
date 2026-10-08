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

export const postParcels = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res
      .status(403)
      .json({ message: "Parcel orders are created by Admin" });
  if (!req.body.items?.length)
    return res.status(400).json({ message: "Add at least one food item" });
  const paymentMethod = req.body.paymentMethod || null;
  if (paymentMethod && !["Cash", "Card / UPI"].includes(paymentMethod))
    return res.status(400).json({ message: "Invalid payment method" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO orders (table_id,order_type,guest_name,customer_phone,waiter,status,payment_status,payment_method,created_at) VALUES (NULL,'parcel',?,?,?,'new',?,?,NOW())",
      [
        req.body.customerName || "Parcel Customer",
        req.body.customerPhone || "",
        req.body.adminName || "Admin",
        paymentMethod ? "paid" : "unpaid",
        paymentMethod,
      ],
    );
    for (const item of req.body.items) {
      const [[menu]] = await conn.query(
        "SELECT price FROM menu_items WHERE id=? AND available=1",
        [item.menuId],
      );
      if (!menu) throw new Error("Menu item unavailable");
      await conn.query(
        "INSERT INTO order_items (order_id,menu_id,quantity,note,price) VALUES (?,?,?,?,?)",
        [result.insertId, item.menuId, item.qty, item.note || "", menu.price],
      );
    }
    const bill = await billFor(result.insertId, conn);
    if (paymentMethod)
      await conn.query(
        "UPDATE orders SET subtotal=?,tax=?,service_charge=?,total=? WHERE id=?",
        [bill.subtotal, bill.tax, bill.service, bill.total, result.insertId],
      );
    await conn.commit();
    res.status(201).json({
      id: result.insertId,
      paymentStatus: paymentMethod ? "paid" : "unpaid",
      bill,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});
