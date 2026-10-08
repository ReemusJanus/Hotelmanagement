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

export const postSupplierpurchases = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const {
      supplierName,
      invoiceNumber = "",
      description,
      purchaseDate,
      totalAmount,
      paidAmount = 0,
      paymentMethod = "Cash",
      reference = "",
      notes = "",
      createdBy = "Admin",
    } = req.body,
    total = Number(totalAmount),
    paid = Number(paidAmount);
  if (
    !supplierName ||
    !description ||
    !purchaseDate ||
    total <= 0 ||
    paid < 0 ||
    paid > total
  )
    return res.status(400).json({
      message:
        "Supplier, description, date, valid total, and paid amount are required",
    });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO supplier_purchases (supplier_name,invoice_number,description,purchase_date,total_amount,notes,created_by) VALUES (?,?,?,?,?,?,?)",
      [
        supplierName,
        invoiceNumber,
        description,
        purchaseDate,
        total,
        notes,
        createdBy,
      ],
    );
    if (paid > 0)
      await conn.query(
        "INSERT INTO supplier_payments (purchase_id,amount,payment_method,payment_date,reference,notes,created_by) VALUES (?,?,?,?,?,?,?)",
        [
          result.insertId,
          paid,
          paymentMethod,
          purchaseDate,
          reference,
          "Payment recorded with purchase",
          createdBy,
        ],
      );
    await conn.commit();
    res.status(201).json({
      id: result.insertId,
      totalAmount: total,
      paidAmount: paid,
      dueAmount: total - paid,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

export const postSupplierpurchasesidpayments = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const amount = Number(req.body.amount);
  if (amount <= 0 || !req.body.paymentDate)
    return res.status(400).json({
      message: "A positive payment amount and payment date are required",
    });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[purchase]] = await conn.query(
      "SELECT id,total_amount totalAmount FROM supplier_purchases WHERE id=? FOR UPDATE",
      [req.params.id],
    );
    if (!purchase)
      throw Object.assign(new Error("Supplier purchase not found"), {
        status: 404,
      });
    const [[totals]] = await conn.query(
      "SELECT COALESCE(SUM(amount),0) paid FROM supplier_payments WHERE purchase_id=?",
      [purchase.id],
    );
    const due = Number(purchase.totalAmount) - Number(totals.paid);
    if (amount > due)
      throw Object.assign(
        new Error(`Payment exceeds outstanding balance of ${due.toFixed(2)}`),
        { status: 409 },
      );
    const [result] = await conn.query(
      "INSERT INTO supplier_payments (purchase_id,amount,payment_method,payment_date,reference,notes,created_by) VALUES (?,?,?,?,?,?,?)",
      [
        purchase.id,
        amount,
        req.body.paymentMethod || "Cash",
        req.body.paymentDate,
        req.body.reference || "",
        req.body.notes || "",
        req.body.createdBy || "Admin",
      ],
    );
    await conn.commit();
    res.status(201).json({
      id: result.insertId,
      paidAmount: Number(totals.paid) + amount,
      dueAmount: due - amount,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

export const deleteSupplierpurchasesid = asyncRoute(async (req, res) => {
  if (portalRole !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM supplier_payments WHERE purchase_id=?", [
      req.params.id,
    ]);
    await conn.query("DELETE FROM supplier_purchases WHERE id=?", [
      req.params.id,
    ]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});
