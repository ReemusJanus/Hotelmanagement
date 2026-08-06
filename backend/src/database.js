import mysql from 'mysql2/promise';
import {AsyncLocalStorage} from 'node:async_hooks';
import {initialData} from './store.js';

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'knockout',
  password: process.env.DB_PASSWORD || 'knockout_pass',
  database: process.env.DB_NAME || 'knockout',
  waitForConnections: true,
  connectionLimit: 10
};

const tenantContext=new AsyncLocalStorage(),pools=new Map();
function tenantPool(database=config.database){
  if(!/^[a-z0-9_]+$/.test(database))throw new Error('Invalid company database');
  if(!pools.has(database))pools.set(database,mysql.createPool({...config,database}));
  return pools.get(database);
}
export const runWithTenant=(database,next)=>tenantContext.run(database||config.database,next);
export const pool={
  query(...args){return tenantPool(tenantContext.getStore()).query(...args)},
  getConnection(){return tenantPool(tenantContext.getStore()).getConnection()}
};

export async function migrate() {
  const sql = [
    `CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY DEFAULT 1, hotel_name VARCHAR(120) NOT NULL, tax_rate DECIMAL(5,2) NOT NULL DEFAULT 5, service_charge DECIMAL(5,2) NOT NULL DEFAULT 5, currency VARCHAR(8) NOT NULL DEFAULT 'INR', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, role ENUM('admin','waiter','chef') NOT NULL, pin VARCHAR(20) NOT NULL, phone VARCHAR(30) DEFAULT '', pay_type ENUM('monthly','hourly') DEFAULT 'monthly', pay_rate DECIMAL(10,2) DEFAULT 0, active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS staff_attendance (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, check_in DATETIME NOT NULL, check_out DATETIME NULL, notes VARCHAR(255) DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS restaurant_tables (id INT AUTO_INCREMENT PRIMARY KEY, table_number INT NOT NULL UNIQUE, seats INT NOT NULL, area VARCHAR(80) NOT NULL, status ENUM('available','occupied','reserved','cleaning') DEFAULT 'available', guest_name VARCHAR(120) DEFAULT '', booking_time VARCHAR(10) DEFAULT '', order_id INT NULL, active BOOLEAN DEFAULT TRUE)`,
    `CREATE TABLE IF NOT EXISTS menu_items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL, category VARCHAR(80) NOT NULL, description VARCHAR(500) DEFAULT '', price DECIMAL(10,2) NOT NULL, icon VARCHAR(20) DEFAULT '🍽️', image_url VARCHAR(500) NULL, image_object VARCHAR(255) NULL, is_combo BOOLEAN DEFAULT FALSE, available BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS combo_components (id INT AUTO_INCREMENT PRIMARY KEY, combo_id INT NOT NULL, menu_id INT NOT NULL, quantity INT NOT NULL DEFAULT 1, FOREIGN KEY (combo_id) REFERENCES menu_items(id) ON DELETE CASCADE, FOREIGN KEY (menu_id) REFERENCES menu_items(id))`,
    `CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, table_id INT NULL, order_type ENUM('dine_in','parcel') NOT NULL DEFAULT 'dine_in', guest_name VARCHAR(120), customer_phone VARCHAR(30) DEFAULT '', waiter VARCHAR(120), status ENUM('new','preparing','ready','served','billing_requested','completed') DEFAULT 'new', payment_status ENUM('unpaid','paid') DEFAULT 'unpaid', payment_method VARCHAR(30) NULL, subtotal DECIMAL(10,2) NULL, tax DECIMAL(10,2) NULL, service_charge DECIMAL(10,2) NULL, total DECIMAL(10,2) NULL, created_at DATETIME NOT NULL, completed_at DATETIME NULL, FOREIGN KEY (table_id) REFERENCES restaurant_tables(id))`,
    `CREATE TABLE IF NOT EXISTS order_items (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, menu_id INT NOT NULL, quantity INT NOT NULL, note VARCHAR(255) DEFAULT '', price DECIMAL(10,2) NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, FOREIGN KEY (menu_id) REFERENCES menu_items(id))`,
    `CREATE TABLE IF NOT EXISTS inventory (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL, category VARCHAR(80), quantity DECIMAL(10,2) NOT NULL, unit VARCHAR(20) NOT NULL, min_quantity DECIMAL(10,2) NOT NULL, cost DECIMAL(10,2) NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS inventory_transactions (id INT AUTO_INCREMENT PRIMARY KEY, inventory_id INT NOT NULL, movement_type ENUM('purchase','usage','adjustment','waste') NOT NULL, quantity DECIMAL(10,2) NOT NULL, unit_cost DECIMAL(10,2) NULL, note VARCHAR(255) DEFAULT '', created_by VARCHAR(120) DEFAULT 'Admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (inventory_id) REFERENCES inventory(id))`,
    `CREATE TABLE IF NOT EXISTS finance_entries (id INT AUTO_INCREMENT PRIMARY KEY, entry_type ENUM('income','expense') NOT NULL, category VARCHAR(100) NOT NULL, description VARCHAR(255) NOT NULL, amount DECIMAL(12,2) NOT NULL, payment_method VARCHAR(40) DEFAULT 'Cash', entry_date DATE NOT NULL, reference VARCHAR(100) DEFAULT '', created_by VARCHAR(120) DEFAULT 'Admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS supplier_purchases (id INT AUTO_INCREMENT PRIMARY KEY, supplier_name VARCHAR(160) NOT NULL, invoice_number VARCHAR(100) DEFAULT '', description VARCHAR(255) NOT NULL, purchase_date DATE NOT NULL, total_amount DECIMAL(12,2) NOT NULL, notes VARCHAR(255) DEFAULT '', created_by VARCHAR(120) DEFAULT 'Admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS supplier_payments (id INT AUTO_INCREMENT PRIMARY KEY, purchase_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, payment_method VARCHAR(40) DEFAULT 'Cash', payment_date DATE NOT NULL, reference VARCHAR(100) DEFAULT '', notes VARCHAR(255) DEFAULT '', created_by VARCHAR(120) DEFAULT 'Admin', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (purchase_id) REFERENCES supplier_purchases(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS bookings (id INT AUTO_INCREMENT PRIMARY KEY, table_id INT NOT NULL, guest_name VARCHAR(120) NOT NULL, booking_time VARCHAR(10) NOT NULL, status ENUM('confirmed','seated','cancelled') DEFAULT 'confirmed', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (table_id) REFERENCES restaurant_tables(id))`
  ];
  for (const statement of sql) await pool.query(statement);
  const upgrades = [
    `ALTER TABLE orders MODIFY table_id INT NULL`,
    `ALTER TABLE orders ADD COLUMN order_type ENUM('dine_in','parcel') NOT NULL DEFAULT 'dine_in' AFTER table_id`,
    `ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(30) DEFAULT '' AFTER guest_name`
    ,`ALTER TABLE menu_items ADD COLUMN description VARCHAR(500) DEFAULT '' AFTER category`
    ,`ALTER TABLE menu_items ADD COLUMN is_combo BOOLEAN DEFAULT FALSE AFTER image_object`
    ,`ALTER TABLE users ADD COLUMN phone VARCHAR(30) DEFAULT '' AFTER pin`
    ,`ALTER TABLE users ADD COLUMN pay_type ENUM('monthly','hourly') DEFAULT 'monthly' AFTER phone`
    ,`ALTER TABLE users ADD COLUMN pay_rate DECIMAL(10,2) DEFAULT 0 AFTER pay_type`
    ,`ALTER TABLE restaurant_tables MODIFY status ENUM('available','occupied','reserved','cleaning') DEFAULT 'available'`
    ,`ALTER TABLE restaurant_tables ADD COLUMN active BOOLEAN DEFAULT TRUE AFTER order_id`
    ,`ALTER TABLE orders MODIFY status ENUM('new','preparing','ready','served','billing_requested','completed') DEFAULT 'new'`
  ];
  for (const statement of upgrades) { try { await pool.query(statement); } catch (error) { if (error.code !== 'ER_DUP_FIELDNAME') throw error; } }
  await seed();
}

async function seed() {
  const [[{count}]] = await pool.query('SELECT COUNT(*) count FROM users');
  if (count) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`INSERT INTO settings (id,hotel_name,tax_rate,service_charge,currency) VALUES (1,'KnockOUT',5,5,'INR')`);
    for (const u of initialData.users) await conn.query('INSERT INTO users (name,role,pin) VALUES (?,?,?)',[u.name,u.role,u.pin]);
    for (const t of initialData.tables) await conn.query('INSERT INTO restaurant_tables (table_number,seats,area,status,guest_name,booking_time) VALUES (?,?,?,?,?,?)',[t.number,t.seats,t.area,t.status,t.guestName,t.bookingTime]);
    for (const m of initialData.menu) await conn.query('INSERT INTO menu_items (name,category,price,icon,available) VALUES (?,?,?,?,?)',[m.name,m.category,m.price,m.icon,m.available]);
    for (const i of initialData.inventory) await conn.query('INSERT INTO inventory (name,category,quantity,unit,min_quantity,cost) VALUES (?,?,?,?,?,?)',[i.name,i.category,i.quantity,i.unit,i.min,i.cost]);
    for (const o of initialData.orders) {
      const [result] = await conn.query('INSERT INTO orders (id,table_id,guest_name,waiter,status,payment_status,created_at) VALUES (?,?,?,?,?,?,?)',[o.id,o.tableId,o.guestName,o.waiter,o.status,o.paymentStatus,new Date(o.createdAt)]);
      for (const item of o.items) { const menu=initialData.menu.find(m=>m.id===item.menuId); await conn.query('INSERT INTO order_items (order_id,menu_id,quantity,note,price) VALUES (?,?,?,?,?)',[result.insertId||o.id,item.menuId,item.qty,item.note,menu.price]); }
      await conn.query('UPDATE restaurant_tables SET order_id=? WHERE id=?',[o.id,o.tableId]);
    }
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
}

export async function getState() {
  const [[settings], [users], [attendance], [tables], [menu], [comboComponents], [orders], [orderItems], [inventory], [inventoryTransactions], [financeEntries], [supplierPurchases], [supplierPayments]] = await Promise.all([
    pool.query('SELECT hotel_name hotelName,tax_rate taxRate,service_charge serviceCharge,currency FROM settings WHERE id=1'),
    pool.query('SELECT id,name,role,pin,phone,pay_type payType,pay_rate payRate,active,created_at createdAt FROM users ORDER BY active DESC,name'),
    pool.query('SELECT a.id,a.user_id userId,a.check_in checkIn,a.check_out checkOut,a.notes,u.name,u.role FROM staff_attendance a JOIN users u ON u.id=a.user_id ORDER BY a.check_in DESC LIMIT 300'),
    pool.query('SELECT id,table_number number,seats,area,status,guest_name guestName,booking_time bookingTime,order_id orderId FROM restaurant_tables WHERE active=TRUE ORDER BY table_number'),
    pool.query('SELECT id,name,category,description,price,icon,image_url imageUrl,image_object imageObject,is_combo isCombo,available FROM menu_items ORDER BY id'),
    pool.query('SELECT cc.combo_id comboId,cc.menu_id menuId,cc.quantity,m.name,m.category FROM combo_components cc JOIN menu_items m ON m.id=cc.menu_id ORDER BY cc.id'),
    pool.query('SELECT id,table_id tableId,order_type orderType,guest_name guestName,customer_phone customerPhone,waiter,status,payment_status paymentStatus,payment_method paymentMethod,total,created_at createdAt,completed_at completedAt FROM orders ORDER BY id DESC'),
    pool.query('SELECT order_id orderId,menu_id menuId,quantity qty,note FROM order_items ORDER BY id'),
    pool.query('SELECT id,name,category,quantity,unit,min_quantity min,cost,updated_at updatedAt FROM inventory ORDER BY id'),
    pool.query('SELECT id,inventory_id inventoryId,movement_type movementType,quantity,unit_cost unitCost,note,created_by createdBy,created_at createdAt FROM inventory_transactions ORDER BY id DESC LIMIT 300'),
    pool.query('SELECT id,entry_type entryType,category,description,amount,payment_method paymentMethod,entry_date entryDate,reference,created_by createdBy,created_at createdAt FROM finance_entries ORDER BY entry_date DESC,id DESC LIMIT 500'),
    pool.query('SELECT id,supplier_name supplierName,invoice_number invoiceNumber,description,purchase_date purchaseDate,total_amount totalAmount,notes,created_by createdBy,created_at createdAt FROM supplier_purchases ORDER BY purchase_date DESC,id DESC LIMIT 500'),
    pool.query('SELECT id,purchase_id purchaseId,amount,payment_method paymentMethod,payment_date paymentDate,reference,notes,created_by createdBy,created_at createdAt FROM supplier_payments ORDER BY payment_date DESC,id DESC LIMIT 1000')
  ]);
  for (const order of orders) order.items = orderItems.filter(i=>i.orderId===order.id);
  return {settings: settings[0], users:users.map(u=>({...u,payRate:Number(u.payRate),active:!!u.active})), attendance, tables, menu: menu.map(m=>({...m,price:Number(m.price),isCombo:!!m.isCombo,available:!!m.available,components:comboComponents.filter(c=>c.comboId===m.id)})), orders: orders.map(o=>({...o,total:o.total&&Number(o.total)})), inventory: inventory.map(i=>({...i,quantity:Number(i.quantity),min:Number(i.min),cost:Number(i.cost)})), inventoryTransactions:inventoryTransactions.map(x=>({...x,quantity:Number(x.quantity),unitCost:x.unitCost===null?null:Number(x.unitCost)})), financeEntries:financeEntries.map(x=>({...x,amount:Number(x.amount)})), supplierPurchases:supplierPurchases.map(x=>({...x,totalAmount:Number(x.totalAmount)})), supplierPayments:supplierPayments.map(x=>({...x,amount:Number(x.amount)}))};
}
