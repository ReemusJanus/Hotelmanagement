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

export const postOrders = asyncRoute(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[table]] = await conn.query(
      "SELECT * FROM restaurant_tables WHERE id=? FOR UPDATE",
      [req.body.tableId],
    );
    if (!table) return res.status(404).json({ message: "Table not found" });
    if (table.order_id)
      return res
        .status(400)
        .json({ message: "This table already has an active order" });
    const [result] = await conn.query(
      "INSERT INTO orders (table_id,guest_name,waiter,status,payment_status,created_at) VALUES (?,?,?,'new','unpaid',NOW())",
      [
        table.id,
        req.body.guestName || table.guest_name || "Walk-in Guest",
        req.body.waiter || "Waiter",
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
    await conn.query(
      "UPDATE restaurant_tables SET status='occupied',guest_name=?,booking_time='',order_id=? WHERE id=?",
      [
        req.body.guestName || table.guest_name || "Walk-in Guest",
        result.insertId,
        table.id,
      ],
    );
    await conn.commit();
    res
      .status(201)
      .json({ id: result.insertId, bill: await billFor(result.insertId) });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

export const postOrdersiditems = asyncRoute(async (req, res) => {
  if (!["admin", "waiter"].includes(portalRole))
    return res
      .status(403)
      .json({ message: "Only Admin or Waiter can add order items" });
  if (!req.body.items?.length)
    return res.status(400).json({ message: "Add at least one item" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query(
      "SELECT id,status FROM orders WHERE id=? FOR UPDATE",
      [req.params.id],
    );
    if (!order)
      throw Object.assign(new Error("Order not found"), { status: 404 });
    if (order.status === "completed")
      throw Object.assign(new Error("This order is already completed"), {
        status: 409,
      });
    for (const item of req.body.items) {
      const qty = Math.max(1, Number(item.qty) || 1),
        note = item.note || "";
      const [[menu]] = await conn.query(
        "SELECT price FROM menu_items WHERE id=? AND available=1",
        [item.menuId],
      );
      if (!menu)
        throw Object.assign(new Error("Menu item unavailable"), {
          status: 400,
        });
      const [[line]] = await conn.query(
        "SELECT id,quantity FROM order_items WHERE order_id=? AND menu_id=? AND note=? LIMIT 1",
        [order.id, item.menuId, note],
      );
      if (line)
        await conn.query("UPDATE order_items SET quantity=? WHERE id=?", [
          line.quantity + qty,
          line.id,
        ]);
      else
        await conn.query(
          "INSERT INTO order_items (order_id,menu_id,quantity,note,price) VALUES (?,?,?,?,?)",
          [order.id, item.menuId, qty, note, menu.price],
        );
    }
    await conn.query("UPDATE orders SET status='new' WHERE id=?", [order.id]);
    await conn.commit();
    res.status(201).json({ id: order.id, bill: await billFor(order.id) });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

export const postOrdersidmarkpaid = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res
      .status(403)
      .json({ message: "Only Admin can record parcel payments" });
  if (!["Cash", "Card / UPI"].includes(req.body.paymentMethod))
    return res.status(400).json({ message: "Choose Cash or Card / UPI" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query(
      "SELECT id,order_type,status,payment_status FROM orders WHERE id=? FOR UPDATE",
      [req.params.id],
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.order_type !== "parcel")
      return res.status(400).json({
        message: "Advance payment is only available for parcel orders",
      });
    if (order.status === "completed")
      return res.status(409).json({ message: "Parcel is already completed" });
    const bill = await billFor(order.id, conn);
    await conn.query(
      "UPDATE orders SET payment_status='paid',payment_method=?,subtotal=?,tax=?,service_charge=?,total=? WHERE id=?",
      [
        req.body.paymentMethod,
        bill.subtotal,
        bill.tax,
        bill.service,
        bill.total,
        order.id,
      ],
    );
    await conn.commit();
    res.json({
      id: order.id,
      paymentStatus: "paid",
      paymentMethod: req.body.paymentMethod,
      bill,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

export const patchOrdersidstatus = asyncRoute(async (req, res) => {
  const allowed = ["new", "preparing", "ready", "served"];
  if (!allowed.includes(req.body.status))
    return res.status(400).json({ message: "Invalid status" });
  await pool.query("UPDATE orders SET status=? WHERE id=?", [
    req.body.status,
    req.params.id,
  ]);
  res.json({ ok: true });
});

export const postOrdersidrequestbill = asyncRoute(async (req, res) => {
  if (portalRole !== "waiter")
    return res
      .status(403)
      .json({ message: "Billing requests must come from the Waiter portal" });
  const [[order]] = await pool.query(
    "SELECT id,table_id tableId,status,payment_status paymentStatus FROM orders WHERE id=?",
    [req.params.id],
  );
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.paymentStatus === "paid" || order.status === "completed")
    return res.status(409).json({ message: "This order is already completed" });
  if (!["ready", "served", "billing_requested"].includes(order.status))
    return res
      .status(409)
      .json({ message: "Wait until the kitchen completes this order" });
  await pool.query("UPDATE orders SET status='billing_requested' WHERE id=?", [
    order.id,
  ]);
  res.json({
    ok: true,
    orderId: order.id,
    tableId: order.tableId,
    bill: await billFor(order.id),
  });
});

export const getOrdersidbill = asyncRoute(async (req, res) => {
  const [[order]] = await pool.query("SELECT * FROM orders WHERE id=?", [
    req.params.id,
  ]);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({ ...(await billFor(order.id)), order });
});

export const postOrdersidfinalize = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res
      .status(403)
      .json({ message: "Only Admin can finalize payments" });
  const bill = await billFor(req.params.id),
    conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query(
      "SELECT * FROM orders WHERE id=? FOR UPDATE",
      [req.params.id],
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    const alreadyPaid = order.payment_status === "paid",
      paymentMethod = alreadyPaid
        ? order.payment_method
        : req.body.paymentMethod || null;
    if (!paymentMethod)
      return res.status(400).json({
        message:
          "Record Cash or Card / UPI payment before completing this order",
      });
    await conn.query(
      "UPDATE orders SET status='completed',payment_status='paid',payment_method=?,subtotal=?,tax=?,service_charge=?,total=?,completed_at=NOW() WHERE id=?",
      [
        paymentMethod,
        bill.subtotal,
        bill.tax,
        bill.service,
        bill.total,
        order.id,
      ],
    );
    if (order.table_id)
      await conn.query(
        "UPDATE restaurant_tables SET status='cleaning',guest_name='',booking_time='',order_id=NULL WHERE id=?",
        [order.table_id],
      );
    await conn.commit();
    res.json({ id: order.id, paymentStatus: "paid", paymentMethod, bill });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});
