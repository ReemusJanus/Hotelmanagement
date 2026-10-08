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

export const postCombos = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const {
    name,
    description = "",
    price,
    icon = "🎁",
    components = [],
  } = req.body;
  if (!name || Number(price) < 0 || !components.length)
    return res.status(400).json({
      message: "Combo name, price, and at least one item are required",
    });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO menu_items (name,category,description,price,icon,available,is_combo) VALUES (?,'Combo Offers',?,?,?,TRUE,TRUE)",
      [name, description, Number(price), icon],
    );
    for (const component of components) {
      const [[item]] = await conn.query(
        "SELECT id FROM menu_items WHERE id=? AND is_combo=FALSE",
        [component.menuId],
      );
      if (!item) throw new Error("A selected combo item is invalid");
      await conn.query(
        "INSERT INTO combo_components (combo_id,menu_id,quantity) VALUES (?,?,?)",
        [
          result.insertId,
          component.menuId,
          Math.max(1, Number(component.quantity) || 1),
        ],
      );
    }
    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

export const putCombosid = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const {
    name,
    description = "",
    price,
    icon = "🎁",
    components = [],
  } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      "UPDATE menu_items SET name=?,category='Combo Offers',description=?,price=?,icon=?,available=TRUE,is_combo=TRUE WHERE id=?",
      [name, description, Number(price), icon, req.params.id],
    );
    await conn.query("DELETE FROM combo_components WHERE combo_id=?", [
      req.params.id,
    ]);
    for (const component of components)
      await conn.query(
        "INSERT INTO combo_components (combo_id,menu_id,quantity) VALUES (?,?,?)",
        [
          req.params.id,
          component.menuId,
          Math.max(1, Number(component.quantity) || 1),
        ],
      );
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});
