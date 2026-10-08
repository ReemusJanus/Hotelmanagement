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

export const postMenu = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const {
    name,
    category,
    description = "",
    price,
    icon = "🍽️",
    available = true,
  } = req.body;
  if (!name || !category || Number(price) < 0)
    return res
      .status(400)
      .json({ message: "Name, category, and valid price are required" });
  const [result] = await pool.query(
    "INSERT INTO menu_items (name,category,description,price,icon,available,is_combo) VALUES (?,?,?,?,?,?,FALSE)",
    [name, category, description, Number(price), icon, !!available],
  );
  res.status(201).json({ id: result.insertId });
});

export const putMenuid = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const {
    name,
    category,
    description = "",
    price,
    icon = "🍽️",
    available = true,
  } = req.body;
  await pool.query(
    "UPDATE menu_items SET name=?,category=?,description=?,price=?,icon=?,available=? WHERE id=?",
    [
      name,
      category,
      description,
      Number(price),
      icon,
      !!available,
      req.params.id,
    ],
  );
  res.json({ ok: true });
});

export const deleteMenuid = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  await pool.query("UPDATE menu_items SET available=FALSE WHERE id=?", [
    req.params.id,
  ]);
  res.json({ ok: true });
});

export const postMenuidimage = asyncRoute(async (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "Please select an image file" });
  const [[item]] = await pool.query(
    "SELECT image_object imageObject FROM menu_items WHERE id=?",
    [req.params.id],
  );
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  const ext =
      req.file.originalname
        .split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "") || "jpg",
    objectName = `menu/${req.params.id}-${crypto.randomUUID()}.${ext}`;
  await minio.putObject(bucket, objectName, req.file.buffer, req.file.size, {
    "Content-Type": req.file.mimetype,
  });
  if (item.imageObject)
    await minio.removeObject(bucket, item.imageObject).catch(() => {});
  const imageUrl = publicUrl(objectName);
  await pool.query(
    "UPDATE menu_items SET image_url=?,image_object=? WHERE id=?",
    [imageUrl, objectName, req.params.id],
  );
  res.json({ imageUrl, objectName });
});

export const deleteMenuidimage = asyncRoute(async (req, res) => {
  const [[item]] = await pool.query(
    "SELECT image_object imageObject FROM menu_items WHERE id=?",
    [req.params.id],
  );
  if (item?.imageObject) await minio.removeObject(bucket, item.imageObject);
  await pool.query(
    "UPDATE menu_items SET image_url=NULL,image_object=NULL WHERE id=?",
    [req.params.id],
  );
  res.json({ ok: true });
});
