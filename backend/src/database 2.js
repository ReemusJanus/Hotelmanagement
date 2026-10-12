import {createPool} from './postgres.js';
import {ensureSchema,tenantDDL,syncSequences} from './schema.js';
import {AsyncLocalStorage} from 'node:async_hooks';
import {initialData} from './store.js';

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'knockout',
  password: process.env.DB_PASSWORD || 'knockout_pass',
  database: process.env.DB_NAME || 'knockout',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE||20),
  maxIdle: Number(process.env.DB_POOL_MAX_IDLE||10),
  idleTimeout: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS||60000),
  queueLimit: Number(process.env.DB_QUEUE_LIMIT||500),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS||10000)
};

const tenantContext=new AsyncLocalStorage(),pools=new Map();
const tenantPoolIdleMs=Number(process.env.TENANT_POOL_IDLE_MS||300000);
function tenantPool(database=config.database){
  if(!/^[a-z0-9_]+$/.test(database))throw new Error('Invalid company database');
  if(!pools.has(database))pools.set(database,{pool:createPool({...config,database}),active:0,lastUsed:Date.now()});
  const record=pools.get(database);record.lastUsed=Date.now();return record;
}
export const runWithTenant=(database,next)=>tenantContext.run(database||config.database,next);
export const pool={
  async query(...args){const record=tenantPool(tenantContext.getStore());record.active++;try{return await record.pool.query(...args)}finally{record.active--;record.lastUsed=Date.now()}},
  async getConnection(){const record=tenantPool(tenantContext.getStore());record.active++;try{const connection=await record.pool.getConnection();const release=connection.release.bind(connection);let released=false;connection.release=()=>{if(!released){released=true;record.active--;record.lastUsed=Date.now()}return release()};return connection}catch(error){record.active--;record.lastUsed=Date.now();throw error}}
};
const poolReaper=setInterval(()=>{const now=Date.now();for(const[database,record]of pools){if(database!==config.database&&record.active===0&&now-record.lastUsed>tenantPoolIdleMs){pools.delete(database);record.pool.end().catch(()=>{})}}},Math.min(tenantPoolIdleMs,60000));
poolReaper.unref();
export async function closePools(){clearInterval(poolReaper);await Promise.allSettled([...pools.values()].map(record=>record.pool.end()));pools.clear()}

export async function migrate() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("SELECT pg_advisory_xact_lock(742918)");
    const [existing] = await conn.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name ~ '^(knockout(_[0-9]+)?|tenant_[a-z][a-z0-9_]+)$'");
    for (const schema of new Set([config.database,...existing.map(row=>row.schema_name)])) await ensureSchema(conn,schema,tenantDDL);
    await syncSequences(conn,config.database);
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
  if (process.env.SEED_DEMO_DATA === 'true') await seed();
}

async function seed() {
  const [[{count}]] = await pool.query("SELECT COUNT(*) count FROM users");
  if (count) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`INSERT INTO settings (id,hotel_name,tax_rate,cgst_rate,service_charge,currency) VALUES (1,'KnockOUT',2.5,2.5,18,'INR')`);
    for (const u of initialData.users) await conn.query("INSERT INTO users (name,role,pin) VALUES (?,?,?)",[u.name,u.role,u.pin]);
    for (const t of initialData.tables) await conn.query("INSERT INTO restaurant_tables (table_number,seats,area,status,guest_name,booking_time) VALUES (?,?,?,?,?,?)",[t.number,t.seats,t.area,t.status,t.guestName,t.bookingTime]);
    for (const m of initialData.menu) await conn.query("INSERT INTO menu_items (name,category,price,icon,available) VALUES (?,?,?,?,?)",[m.name,m.category,m.price,m.icon,m.available]);
    for (const i of initialData.inventory) await conn.query("INSERT INTO inventory (name,category,quantity,unit,min_quantity,cost) VALUES (?,?,?,?,?,?)",[i.name,i.category,i.quantity,i.unit,i.min,i.cost]);
    for (const o of initialData.orders) {
      const [result] = await conn.query("INSERT INTO orders (id,table_id,guest_name,waiter,status,payment_status,created_at) VALUES (?,?,?,?,?,?,?)",[o.id,o.tableId,o.guestName,o.waiter,o.status,o.paymentStatus,new Date(o.createdAt)]);
      for (const item of o.items) { const menu=initialData.menu.find(m=>m.id===item.menuId); await conn.query("INSERT INTO order_items (order_id,menu_id,quantity,note,price) VALUES (?,?,?,?,?)",[result.insertId||o.id,item.menuId,item.qty,item.note,menu.price]); }
      await conn.query("UPDATE restaurant_tables SET order_id=? WHERE id=?",[o.id,o.tableId]);
    }
    await syncSequences(conn,config.database);
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; } finally { conn.release(); }
}

export async function getState() {
  const historyDays=Math.max(7,Math.min(365,Number(process.env.STATE_HISTORY_DAYS||90)));
  const [[settings], [users], [attendance], [kitchenStaff], [tables], [bookings], [menu], [comboComponents], [orders], [orderItems], [inventory], [inventoryTransactions], [stockRequests], [financeEntries], [supplierPurchases], [supplierPayments]] = await Promise.all([
    pool.query("SELECT hotel_name \"hotelName\",tax_rate \"taxRate\",cgst_rate \"cgstRate\",service_charge \"serviceCharge\",currency FROM settings WHERE id=1"),
    pool.query("SELECT id,name,role,pin,phone,pay_type \"payType\",pay_rate \"payRate\",active,created_at \"createdAt\" FROM users WHERE deleted_at IS NULL ORDER BY active DESC,name"),
    pool.query("SELECT a.id,a.user_id \"userId\",a.check_in \"checkIn\",a.check_out \"checkOut\",a.notes,u.name,u.role FROM staff_attendance a JOIN users u ON u.id=a.user_id ORDER BY a.check_in DESC LIMIT 300"),
    pool.query("SELECT id,name,designation,phone,specialization,pay_type \"payType\",pay_rate \"payRate\",joined_on \"joinedOn\",notes,active,created_by \"createdBy\",created_at \"createdAt\" FROM kitchen_staff ORDER BY active DESC,name"),
    pool.query("SELECT id,table_number number,seats,area,status,guest_name \"guestName\",booking_time \"bookingTime\",order_id \"orderId\" FROM restaurant_tables WHERE active=TRUE ORDER BY table_number"),
    pool.query("SELECT b.id,b.table_id \"tableId\",t.table_number \"tableNumber\",t.seats,t.area,b.customer_phone \"customerPhone\",to_char(b.booking_date, 'YYYY-MM-DD') \"bookingDate\",b.booking_time \"bookingTime\",b.duration_minutes \"durationMinutes\",b.status,b.notification_status \"notificationStatus\",b.notification_message \"notificationMessage\",b.created_at \"createdAt\",(NOW() >= (b.booking_date::date + b.booking_time::time) AND NOW() < ((b.booking_date::date + b.booking_time::time) + (b.duration_minutes)::double precision * INTERVAL '1 minute')) \"activeNow\" FROM bookings b JOIN restaurant_tables t ON t.id=b.table_id WHERE t.active=TRUE AND b.status='confirmed' AND ((b.booking_date::date + b.booking_time::time) + (b.duration_minutes)::double precision * INTERVAL '1 minute') >= NOW() ORDER BY b.booking_date,b.booking_time"),
    pool.query("SELECT id,name,category,description,price,icon,image_url \"imageUrl\",image_object \"imageObject\",is_combo \"isCombo\",available FROM menu_items ORDER BY id"),
    pool.query("SELECT cc.combo_id \"comboId\",cc.menu_id \"menuId\",cc.quantity,m.name,m.category FROM combo_components cc JOIN menu_items m ON m.id=cc.menu_id ORDER BY cc.id"),
    pool.query(`SELECT o.id,o.table_id "tableId",o.order_type "orderType",o.guest_name "guestName",o.customer_phone "customerPhone",o.waiter,o.status,o.payment_status "paymentStatus",o.payment_method "paymentMethod",o.total,o.created_at "createdAt",o.completed_at "completedAt",(SELECT COUNT(*) FROM orders daily WHERE daily.created_at>=DATE(o.created_at) AND daily.created_at<DATE(o.created_at)+INTERVAL '1 day' AND daily.id<=o.id) "dailyNumber" FROM orders o WHERE o.completed_at IS NULL OR o.completed_at>=(NOW() - (${historyDays})::double precision * INTERVAL '1 day') ORDER BY o.id DESC LIMIT 5000`),
    pool.query(`SELECT oi.order_id "orderId",oi.menu_id "menuId",oi.quantity qty,oi.note,oi.production_status "itemStatus",oi.batch_no "batchNo",oi.handoff_status "handoffStatus" FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.completed_at IS NULL OR o.completed_at>=(NOW() - (${historyDays})::double precision * INTERVAL '1 day') ORDER BY oi.id`),
    pool.query("SELECT id,name,category,quantity,unit,min_quantity min,cost,updated_at \"updatedAt\" FROM inventory ORDER BY id"),
    pool.query("SELECT id,inventory_id \"inventoryId\",movement_type \"movementType\",quantity,unit_cost \"unitCost\",note,created_by \"createdBy\",created_at \"createdAt\" FROM inventory_transactions ORDER BY id DESC LIMIT 300"),
    pool.query("SELECT r.id,r.inventory_id \"inventoryId\",i.name \"itemName\",i.category,i.quantity \"currentQuantity\",i.unit,i.min_quantity \"minQuantity\",r.requested_quantity \"requestedQuantity\",r.note,r.requested_by \"requestedBy\",r.status,r.created_at \"createdAt\",r.updated_at \"updatedAt\",r.resolved_at \"resolvedAt\" FROM stock_requests r JOIN inventory i ON i.id=r.inventory_id ORDER BY (CASE r.status WHEN 'pending' THEN 1 WHEN 'ordered' THEN 2 WHEN 'resolved' THEN 3 ELSE 0 END),r.id DESC LIMIT 300"),
    pool.query("SELECT id,entry_type \"entryType\",category,description,amount,payment_method \"paymentMethod\",entry_date \"entryDate\",reference,created_by \"createdBy\",created_at \"createdAt\" FROM finance_entries ORDER BY entry_date DESC,id DESC LIMIT 500"),
    pool.query("SELECT id,supplier_name \"supplierName\",invoice_number \"invoiceNumber\",description,purchase_date \"purchaseDate\",total_amount \"totalAmount\",notes,created_by \"createdBy\",created_at \"createdAt\" FROM supplier_purchases ORDER BY purchase_date DESC,id DESC LIMIT 500"),
    pool.query("SELECT id,purchase_id \"purchaseId\",amount,payment_method \"paymentMethod\",payment_date \"paymentDate\",reference,notes,created_by \"createdBy\",created_at \"createdAt\" FROM supplier_payments ORDER BY payment_date DESC,id DESC LIMIT 1000")
  ]);
  for (const booking of bookings) {
    booking.durationMinutes=Number(booking.durationMinutes);
    booking.activeNow=!!booking.activeNow;
    const table=tables.find(t=>t.id===booking.tableId);
    if (booking.activeNow && table && !table.orderId && table.status==='available') {
      table.status='reserved';
      table.bookingTime=booking.bookingTime;
      table.bookingDate=booking.bookingDate;
      table.customerPhone=booking.customerPhone;
    }
  }
  for (const order of orders) order.items = orderItems.filter(i=>i.orderId===order.id);
  return {settings: settings[0], users:users.map(u=>({...u,payRate:Number(u.payRate),active:!!u.active})), attendance, kitchenStaff:kitchenStaff.map(u=>({...u,payRate:Number(u.payRate),active:!!u.active})), tables, bookings, menu: menu.map(m=>({...m,price:Number(m.price),isCombo:!!m.isCombo,available:!!m.available,components:comboComponents.filter(c=>c.comboId===m.id)})), orders: orders.map(o=>({...o,total:o.total&&Number(o.total)})), inventory: inventory.map(i=>({...i,quantity:Number(i.quantity),min:Number(i.min),cost:Number(i.cost)})), inventoryTransactions:inventoryTransactions.map(x=>({...x,quantity:Number(x.quantity),unitCost:x.unitCost===null?null:Number(x.unitCost)})), stockRequests:stockRequests.map(x=>({...x,currentQuantity:Number(x.currentQuantity),minQuantity:Number(x.minQuantity),requestedQuantity:Number(x.requestedQuantity)})), financeEntries:financeEntries.map(x=>({...x,amount:Number(x.amount)})), supplierPurchases:supplierPurchases.map(x=>({...x,totalAmount:Number(x.totalAmount)})), supplierPayments:supplierPayments.map(x=>({...x,amount:Number(x.amount)}))};
}
