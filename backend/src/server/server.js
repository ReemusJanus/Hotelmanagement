import express from "express";
import healthRoutes from "../routes/healthRoutes.js";
import stateRoutes from "../routes/stateRoutes.js";
import loginRoutes from "../routes/loginRoutes.js";
import bookingsRoutes from "../routes/bookingsRoutes.js";
import ordersRoutes from "../routes/ordersRoutes.js";
import tablesRoutes from "../routes/tablesRoutes.js";
import parcelsRoutes from "../routes/parcelsRoutes.js";
import inventoryRoutes from "../routes/inventoryRoutes.js";
import financeRoutes from "../routes/financeRoutes.js";
import supplierPurchasesRoutes from "../routes/supplier-purchasesRoutes.js";
import settingsRoutes from "../routes/settingsRoutes.js";
import attendanceRoutes from "../routes/attendanceRoutes.js";
import staffRoutes from "../routes/staffRoutes.js";
import menuRoutes from "../routes/menuRoutes.js";
import combosRoutes from "../routes/combosRoutes.js";
import cors from "cors";
import multer from "multer";
import crypto from "node:crypto";
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

const app = express();
const portalRole = process.env.PORTAL_ROLE || "admin";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  const requested = String(
    req.headers["x-company-database"] || process.env.DB_NAME || "knockout",
  ).toLowerCase();
  const database = /^knockout(?:_[0-9]+)?$/.test(requested)
    ? requested
    : process.env.DB_NAME || "knockout";
  runWithTenant(database, next);
});

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

async function verifyPortalStaff(userId) {
  const [[staff]] = await pool.query(
    "SELECT id,name,role FROM users WHERE id=? AND active=1",
    [userId],
  );
  if (!staff) return null;
  if (portalRole !== "admin" && staff.role !== portalRole) return null;
  return staff;
}
app.use("/api/health", healthRoutes);
app.use("/api/state", stateRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/parcels", parcelsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/supplier-purchases", supplierPurchasesRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/combos", combosRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res
    .status(error.status || 500)
    .json({ message: error.message || "Server error" });
});

const port = process.env.PORT || 4000;
async function start() {
  for (let i = 0; i < 30; i++) {
    try {
      await migrate();
      await initializeStorage();
      app.listen(port, () =>
        console.log(`KnockOUT API on http://localhost:${port}`),
      );
      return;
    } catch (e) {
      console.log(`Waiting for services (${i + 1}/30): ${e.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  process.exit(1);
}
start();
