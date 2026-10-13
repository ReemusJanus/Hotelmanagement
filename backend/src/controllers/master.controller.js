import crypto from 'node:crypto';
import {
  validTenant,
  ident,
  tenantDatabaseName,
  defaultModules,
  moduleCatalog,
  packages,
  parseModules,
  randomDigits,
  issuePortalToken
} from '../middleware/auth.js';
import { ensureSchema, tenantDDL, syncSequences } from '../schema.js';
import { quoteIdentifier } from '../postgres.js';
import { ensureStorageFolders } from '../storage.js';

let masterPool, adminPool, broadcastChangeFn, queueNoticeFn;

export function initMasterController({ masterPool: mp, adminPool: ap, broadcastChange, queueNotice }) {
  masterPool = mp;
  adminPool = ap;
  broadcastChangeFn = broadcastChange;
  queueNoticeFn = queueNotice;
}

export async function currentPricing() {
  const [rows] = await masterPool.query('SELECT module_key "moduleKey",module_name "moduleName",monthly_price "monthlyPrice" FROM module_pricing ORDER BY module_name');
  return Object.fromEntries(rows.map(row => [row.moduleKey, { name: row.moduleName, price: Number(row.monthlyPrice) }]));
}

export async function generateHotelId() {
  for (let attempt = 0; attempt < 200; attempt++) {
    const hotelId = String(crypto.randomInt(1000, 10000));
    const [[used]] = await masterPool.query('SELECT id FROM companies WHERE hotel_id=? LIMIT 1', [hotelId]);
    if (!used) return hotelId;
  }
  throw Object.assign(new Error('Unable to allocate a Hotel ID. Please try again.'), { status: 503 });
}

export async function generateTemporaryPin() {
  for (let i = 0; i < 200; i++) {
    const pin = randomDigits(6);
    const [[used]] = await masterPool.query('SELECT id FROM company_registration_requests WHERE temporary_pin=? AND completed_at IS NULL', [pin]);
    if (!used) return pin;
  }
  throw Object.assign(new Error('Unable to generate temporary access PIN'), { status: 503 });
}

export async function findPortalLogins(role, pin, includeInactive = false, hotelId = null) {
  const matches = [];
  if (!role || role === 'superadmin') {
    const [[masterUser]] = await masterPool.query(`SELECT id,name FROM master_users WHERE pin=? ${includeInactive ? '' : 'AND active=TRUE'} LIMIT 1`, [String(pin)]);
    if (masterUser) matches.push({ ...masterUser, role: 'superadmin', companyDatabase: null, companyName: 'KnockOUT Master' });
  }
  const params = role ? [role, String(pin)] : [String(pin)];
  if (hotelId) params.push(String(hotelId));
  const [users] = await masterPool.query(
    `SELECT cu.tenant_user_id id,cu.name,cu.role,cu.active "userActive",c.database_name "companyDatabase",c.company_name "companyName",c.hotel_id "hotelId",c.modules,c.status "companyStatus" FROM company_users cu JOIN companies c ON c.id=cu.company_id WHERE ${role ? 'cu.role=? AND ' : ''}cu.pin=? ${hotelId ? 'AND c.hotel_id=? ' : ''}${includeInactive ? '' : "AND cu.active=TRUE AND c.status='active'"}`,
    params
  );
  users.forEach(user => { user.modules = parseModules(user.modules); });
  matches.push(...users);
  return matches;
}

export async function syncCompanyUsers(databaseName) {
  if (!validTenant(databaseName)) return;
  const [[company]] = await masterPool.query('SELECT id FROM companies WHERE database_name=?', [databaseName]);
  if (!company) return;
  const [users] = await adminPool.query(`SELECT id,name,role,pin,phone,email,profile_image_url "profileImageUrl",active FROM "${databaseName}".users WHERE deleted_at IS NULL`);
  const conn = await masterPool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM company_users WHERE company_id=?', [company.id]);
    for (const user of users) {
      await conn.query(
        'INSERT INTO company_users (company_id,tenant_user_id,name,role,pin,phone,email,profile_image_url,active) VALUES (?,?,?,?,?,?,?,?,?)',
        [company.id, user.id, user.name, user.role, user.pin, user.phone || '', user.email || '', user.profileImageUrl || null, !!user.active]
      );
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function generateMonthlySaasInvoices() {
  const billingMonth = new Date().toISOString().slice(0, 7) + '-01';
  const [companies] = await masterPool.query("SELECT c.id,c.modules FROM companies c WHERE NOT EXISTS (SELECT 1 FROM tenant_subscriptions s WHERE s.company_id=c.id AND s.status IN ('active','grace') AND NOW()<s.grace_ends_at)");
  const [pricingRows] = await masterPool.query('SELECT module_key "moduleKey",module_name "moduleName",monthly_price "monthlyPrice" FROM module_pricing');
  const pricing = Object.fromEntries(pricingRows.map(row => [row.moduleKey, [row.moduleName, Number(row.monthlyPrice)]]));

  for (const company of companies) {
    const modules = parseModules(company.modules);
    const items = Object.entries(pricing).filter(([key]) => modules[key] !== false).map(([key, [name, price]]) => ({ key, name, price }));
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const tax = Number((subtotal * 0.18).toFixed(2));
    await masterPool.query(
      "INSERT INTO saas_invoices (company_id,billing_month,line_items,subtotal,tax_rate,tax,total) VALUES (?,?,?, ?,18,?,?) ON CONFLICT (company_id,billing_month) DO UPDATE SET line_items=(CASE WHEN saas_invoices.status='due' THEN EXCLUDED.line_items ELSE saas_invoices.line_items END),subtotal=(CASE WHEN saas_invoices.status='due' THEN EXCLUDED.subtotal ELSE saas_invoices.subtotal END),tax=(CASE WHEN saas_invoices.status='due' THEN EXCLUDED.tax ELSE saas_invoices.tax END),total=(CASE WHEN saas_invoices.status='due' THEN EXCLUDED.total ELSE saas_invoices.total END)",
      [company.id, billingMonth, JSON.stringify(items), subtotal, tax, subtotal + tax]
    );
  }
}

export async function enforceSubscriptions() {
  const [expired] = await masterPool.query("SELECT s.id,s.company_id \"companyId\",c.company_name \"companyName\",c.email,c.phone FROM tenant_subscriptions s JOIN companies c ON c.id=s.company_id WHERE s.status<>'expired' AND NOW()>s.grace_ends_at");
  for (const row of expired) {
    await masterPool.query("UPDATE tenant_subscriptions SET status='expired' WHERE id=?", [row.id]);
    await masterPool.query("UPDATE companies SET status='suspended' WHERE id=?", [row.companyId]);
    await queueNoticeFn(row.email, 'email', 'KnockOUT subscription suspended', `${row.companyName} was suspended because renewal payment was not received during the two-day grace period.`);
  }

  const [grace] = await masterPool.query("SELECT s.id,s.company_id \"companyId\",c.company_name \"companyName\",c.email,c.phone,s.expires_at \"expiresAt\" FROM tenant_subscriptions s JOIN companies c ON c.id=s.company_id WHERE s.status='active' AND NOW()>s.expires_at AND NOW()<=s.grace_ends_at");
  for (const row of grace) {
    await masterPool.query("UPDATE tenant_subscriptions SET status='grace',last_reminder_at=NOW() WHERE id=?", [row.id]);
    await queueNoticeFn(row.email, 'email', 'KnockOUT renewal payment due', `${row.companyName} subscription has expired. Please renew within two days to avoid suspension.`);
    if (row.phone) await queueNoticeFn(row.phone, 'sms', 'Renewal due', `KnockOUT subscription expired. Renew within 2 days to keep ${row.companyName} active.`);
  }
}

export async function ensureDailyFinanceTables(databaseName) {
  if (!validTenant(databaseName)) throw new Error('Invalid tenant schema');
  const conn = await adminPool.getConnection();
  try {
    await conn.beginTransaction();
    await ensureSchema(conn, databaseName, tenantDDL);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function migrateTenantImages(company) {
  const { storagePrefix, copyImage } = await import('../storage.js');
  const prefix = `${storagePrefix(company.companyName)}/images/`;
  const [menu] = await adminPool.query(`SELECT id,image_object "imageObject" FROM "${company.databaseName}".menu_items WHERE image_object IS NOT NULL AND image_object<>''`);
  for (const item of menu) {
    if (item.imageObject.startsWith(prefix)) continue;
    try {
      const stored = await copyImage(company.companyName, item.imageObject, `menu/${item.id}-${String(item.imageObject).split('/').pop()}`);
      await adminPool.query(`UPDATE "${company.databaseName}".menu_items SET image_object=?,image_url=? WHERE id=?`, [stored.objectName, stored.url, item.id]);
    } catch {}
  }
  const [users] = await adminPool.query(`SELECT id,profile_image_object "imageObject" FROM "${company.databaseName}".users WHERE profile_image_object IS NOT NULL AND profile_image_object<>''`);
  for (const user of users) {
    if (user.imageObject.startsWith(prefix)) continue;
    try {
      const stored = await copyImage(company.companyName, user.imageObject, `profiles/${user.id}-${String(user.imageObject).split('/').pop()}`);
      await adminPool.query(`UPDATE "${company.databaseName}".users SET profile_image_object=?,profile_image_url=? WHERE id=?`, [stored.objectName, stored.url, user.id]);
    } catch {}
  }
}

export async function companySummary(company) {
  company.modules = parseModules(company.modules);
  try {
    if (!validTenant(company.databaseName)) throw new Error('Invalid tenant database');
    const db = `"${company.databaseName}"`;
    const [[users], [orders], [revenue], [stock], [daily]] = await Promise.all([
      masterPool.query('SELECT tenant_user_id id,name,role,pin,phone,active FROM company_users WHERE company_id=? ORDER BY role,name', [company.id]),
      adminPool.query(`SELECT COUNT(*) count FROM ${db}.orders WHERE status<>'completed'`),
      adminPool.query(`SELECT COALESCE(SUM(total),0) total FROM ${db}.orders WHERE payment_status='paid'`),
      adminPool.query(`SELECT COUNT(*) count FROM ${db}.inventory WHERE quantity<=min_quantity`),
      adminPool.query(`SELECT to_char(completed_at, 'YYYY-MM-DD') AS day,COUNT(*) bills,COALESCE(SUM(total),0) total FROM ${db}.orders WHERE payment_status='paid' AND completed_at IS NOT NULL GROUP BY to_char(completed_at,'YYYY-MM-DD') ORDER BY day DESC LIMIT 31`)
    ]);
    return {
      ...company,
      users: users.map(user => ({ ...user, active: !!user.active })),
      staffCount: users.filter(user => user.active).length,
      adminLoginActive: users.some(user => user.role === 'admin' && user.active),
      activeOrders: orders[0].count,
      revenue: Number(revenue[0].total),
      dailyRevenue: daily.map(row => ({ date: row.day, bills: row.bills, total: Number(row.total) })),
      lowStock: stock[0].count,
      online: true
    };
  } catch (error) {
    console.error('Company summary failed:', error.message);
    return {
      ...company,
      users: [],
      staffCount: 0,
      adminLoginActive: false,
      activeOrders: 0,
      revenue: 0,
      dailyRevenue: [],
      lowStock: 0,
      online: false
    };
  }
}

export async function provisionCompany({ companyName, adminName, email = '', phone = '', selectedModules = null }) {
  const masterDb = process.env.MASTER_DB_NAME || 'knockout_master';
  const databaseName = tenantDatabaseName(companyName);
  const tenant = quoteIdentifier(databaseName);
  const master = quoteIdentifier(masterDb);

  if (!adminName) throw Object.assign(new Error('Admin name is required'), { status: 400 });

  const conn = await adminPool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SELECT pg_advisory_xact_lock(742919)');
    const [[exists]] = await conn.query(`SELECT id FROM ${master}.companies WHERE company_name=? OR database_name=?`, [companyName, databaseName]);
    const [[schema]] = await conn.query('SELECT schema_name FROM information_schema.schemata WHERE schema_name=?', [databaseName]);
    if (exists || schema) throw Object.assign(new Error('This company or tenant schema already exists'), { status: 409 });

    await ensureSchema(conn, databaseName, tenantDDL);
    const hotelId = await generateHotelId();
    const adminPin = String(crypto.randomInt(100000, 1000000));

    await conn.query(`INSERT INTO ${tenant}.settings (id,hotel_name,tax_rate,cgst_rate,service_charge,currency) VALUES (1,?,2.5,2.5,18,'INR')`, [companyName]);
    await conn.query(`INSERT INTO ${tenant}.users (name,role,pin,phone,email,active) VALUES (?,'admin',?,?,?,TRUE)`, [adminName, adminPin, phone, email]);
    await conn.query(`INSERT INTO ${tenant}.menu_items (id,name,category,description,price,icon,image_url,image_object,is_combo,available) SELECT id,name,category,description,price,icon,image_url,image_object,is_combo,available FROM knockout.menu_items`);
    await conn.query(`INSERT INTO ${tenant}.combo_components (combo_id,menu_id,quantity) SELECT combo_id,menu_id,quantity FROM knockout.combo_components`);
    await conn.query(`INSERT INTO ${tenant}.inventory (name,category,quantity,unit,min_quantity,cost) SELECT name,category,0,unit,min_quantity,cost FROM knockout.inventory`);
    await syncSequences(conn, databaseName);

    const enabledModules = selectedModules
      ? Object.fromEntries(Object.keys(defaultModules).map(key => [key, selectedModules.includes(key)]))
      : defaultModules;

    const [result] = await conn.query(
      `INSERT INTO ${master}.companies (company_name,database_name,cy_db,hotel_id,modules,admin_name,email,phone) VALUES (?,?,?,?,?,?,?,?)`,
      [companyName, databaseName, databaseName, hotelId, JSON.stringify(enabledModules), adminName, email, phone]
    );

    await conn.query(`INSERT INTO ${master}.company_users (company_id,tenant_user_id,name,role,pin,phone,email,profile_image_url,active) SELECT ?,id,name,role,pin,phone,email,profile_image_url,active FROM ${tenant}.users`, [result.insertId]);
    await ensureStorageFolders(companyName);
    await conn.commit();

    return {
      id: result.insertId,
      companyName,
      databaseName,
      hotelId,
      adminPin,
      modules: enabledModules,
      adminName,
      email,
      phone,
      status: 'active'
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// Controller handlers
export async function getLive(_req, res) {
  res.json({ ok: true, service: 'knockout-api' });
}

export async function getHealth(_req, res) {
  const masterDb = process.env.MASTER_DB_NAME || 'knockout_master';
  await masterPool.query('SELECT 1');
  const { realtimeStatus } = await import('../realtime.js');
  res.json({ ok: true, service: 'knockout-api', database: 'postgresql', masterSchema: masterDb, realtime: realtimeStatus() });
}

export async function getPublicCompanies(_req, res) {
  const [rows] = await masterPool.query("SELECT id,company_name \"companyName\",database_name \"databaseName\" FROM companies WHERE status='active' ORDER BY id");
  res.json(rows);
}

export async function postCompanyRegistrations(req, res) {
  const companyName = String(req.body.companyName || '').trim();
  const adminName = String(req.body.adminName || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim().replace(/[\s()-]/g, '');
  const packageCode = String(req.body.packageCode || 'starter');
  const periodMonths = Number(req.body.periodMonths || 1);

  if (!companyName || !adminName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\+?[0-9]{8,15}$/.test(phone) || !packages[packageCode] || ![1, 6, 12].includes(periodMonths)) {
    return res.status(400).json({ message: 'Enter valid business details, package, and subscription period' });
  }

  const databaseName = tenantDatabaseName(companyName);
  const [[company]] = await masterPool.query('SELECT id FROM companies WHERE company_name=? OR database_name=?', [companyName, databaseName]);
  const [[pending]] = await masterPool.query("SELECT id FROM company_registration_requests WHERE (company_name=? OR email=?) AND completed_at IS NULL AND status IN ('pending','approved') LIMIT 1", [companyName, email]);

  if (company) return res.status(409).json({ message: 'This hotel/business name is already registered' });
  if (pending) return res.status(409).json({ message: 'An active application already uses this business name or email' });

  const temporaryPin = await generateTemporaryPin();
  const selectedModules = packages[packageCode];
  const [result] = await masterPool.query(
    'INSERT INTO company_registration_requests (company_name,hotel_id,admin_name,admin_pin,temporary_pin,package_code,period_months,selected_modules,email,phone) VALUES (?,NULL,?,NULL,?,?,?,?,?,?)',
    [companyName, adminName, temporaryPin, packageCode, periodMonths, JSON.stringify(selectedModules), email, phone]
  );

  const message = `Your KnockOUT application is waiting for approval. Temporary onboarding PIN: ${temporaryPin}. No Hotel ID is required for this temporary PIN.`;
  await queueNoticeFn(email, 'email', 'KnockOUT application received', message);
  await queueNoticeFn(phone, 'sms', 'Application received', message);
  broadcastChangeFn('master', 'registration.waiting');

  res.status(201).json({
    id: result.insertId,
    status: 'pending',
    temporaryPin,
    message: 'Sent for approval. Your temporary onboarding PIN has been queued to your email and mobile.'
  });
}

export async function resolveLogin(req, res) {
  await enforceSubscriptions();
  const hotelId = String(req.body.hotelId || '');
  const pin = String(req.body.pin || '');

  if (!hotelId || hotelId === '0000') {
    const [[masterUser]] = await masterPool.query('SELECT id,name FROM master_users WHERE pin=? AND active=TRUE LIMIT 1', [pin]);
    if (masterUser) {
      const user = { ...masterUser, role: 'superadmin', companyDatabase: null, companyName: 'KnockOUT Master', hotelId: '0000' };
      return res.json({ ...user, accessToken: issuePortalToken(user) });
    }
    if (!hotelId) {
      const [[application]] = await masterPool.query('SELECT id,company_name "companyName",admin_name name,status,completed_at "completedAt" FROM company_registration_requests WHERE temporary_pin=? AND completed_at IS NULL LIMIT 1', [pin]);
      if (application) return res.json({ ...application, role: 'applicant', temporaryPin: pin });
      return res.status(401).json({ message: 'Invalid Super Admin or temporary onboarding PIN. Hotel staff must enter their Hotel ID.' });
    }
    return res.status(401).json({ message: 'Invalid Master Hotel ID or PIN' });
  }

  if (!/^[0-9]{4}$/.test(hotelId) || !/^[0-9]{6}$/.test(pin)) {
    return res.status(400).json({ message: 'Enter your 4-digit Hotel ID and 6-digit PIN' });
  }

  const matches = await findPortalLogins(null, pin, false, hotelId);
  if (!matches.length) {
    const blocked = await findPortalLogins(null, pin, true, hotelId);
    const suspended = blocked.find(user => user.companyStatus === 'suspended');
    if (suspended) {
      return res.status(403).json({ code: 'COMPANY_SUSPENDED', message: `${suspended.companyName} is suspended. Renew the KnockOUT subscription to restore access.` });
    }
    return res.status(401).json({ message: 'Invalid Hotel ID, PIN, or inactive account' });
  }

  const user = matches[0];
  await masterPool.query('INSERT INTO usage_logins (company_id,user_id,role) SELECT id,?,? FROM companies WHERE database_name=?', [user.id, user.role, user.companyDatabase]);
  res.json({ ...user, accessToken: issuePortalToken(user) });
}

export async function onboardingStatus(req, res) {
  const [[row]] = await masterPool.query('SELECT id,company_name "companyName",admin_name "adminName",email,phone,status,package_code "packageCode",period_months "periodMonths",selected_modules "selectedModules",review_note "reviewNote",reviewed_at "reviewedAt" FROM company_registration_requests WHERE id=? AND temporary_pin=? AND completed_at IS NULL', [req.body.id, String(req.body.pin || '')]);
  if (!row) return res.status(401).json({ message: 'Temporary onboarding session is invalid' });

  row.selectedModules = typeof row.selectedModules === 'string' ? JSON.parse(row.selectedModules) : row.selectedModules;
  const pricing = await currentPricing();
  const monthly = row.selectedModules.reduce((sum, key) => sum + (pricing[key]?.price || 0), 0);
  const discount = row.periodMonths === 12 ? 0.10 : row.periodMonths === 6 ? 0.05 : 0;
  const subtotal = Math.round(monthly * row.periodMonths * (1 - discount));
  const tax = Math.round(subtotal * 0.18);
  res.json({ ...row, monthly, discount, subtotal, tax, total: subtotal + tax });
}

export async function completeRegistration(req, res) {
  const pin = String(req.body.pin || '');
  const [[request]] = await masterPool.query('SELECT id,company_name "companyName",admin_name "adminName",email,phone,status,package_code "packageCode",period_months "periodMonths",selected_modules "selectedModules" FROM company_registration_requests WHERE id=? AND temporary_pin=? AND completed_at IS NULL', [req.body.id, pin]);
  if (!request) return res.status(401).json({ message: 'Temporary onboarding session is invalid' });
  if (request.status !== 'approved') return res.status(409).json({ message: 'Master approval is required before completing registration' });

  const paymentReference = String(req.body.paymentReference || '').trim();
  if (paymentReference.length < 5) return res.status(400).json({ message: 'A valid payment reference is required' });

  request.selectedModules = typeof request.selectedModules === 'string' ? JSON.parse(request.selectedModules) : request.selectedModules;
  const setupData = { businessType: String(req.body.businessType || ''), address: String(req.body.address || ''), gstNumber: String(req.body.gstNumber || '') };
  if (!setupData.businessType || !setupData.address) return res.status(400).json({ message: 'Business type and address are required' });

  const company = await provisionCompany(request);
  const period = Number(request.periodMonths);
  const expires = new Date();
  expires.setMonth(expires.getMonth() + period);
  const grace = new Date(expires);
  grace.setDate(grace.getDate() + 2);

  await masterPool.query('INSERT INTO tenant_subscriptions (company_id,package_code,period_months,started_at,expires_at,grace_ends_at) VALUES (?,?,?,NOW(),?,?)', [company.id, request.packageCode, period, expires, grace]);
  const pricing = await currentPricing();
  const discount = period === 12 ? 0.10 : period === 6 ? 0.05 : 0;
  const items = request.selectedModules.map(key => ({ key, name: pricing[key]?.name || key, monthlyPrice: pricing[key]?.price || 0, months: period }));
  const monthly = items.reduce((sum, item) => sum + item.monthlyPrice, 0);
  const subtotal = Math.round(monthly * period * (1 - discount));
  const tax = Math.round(subtotal * 0.18);
  const billingMonth = new Date().toISOString().slice(0, 7) + '-01';

  await masterPool.query("INSERT INTO saas_invoices (company_id,billing_month,line_items,subtotal,tax_rate,tax,total,status,paid_at) VALUES (?,?,?,?,18,?,?,'paid',NOW()) ON CONFLICT (company_id,billing_month) DO UPDATE SET line_items=EXCLUDED.line_items,subtotal=EXCLUDED.subtotal,tax=EXCLUDED.tax,total=EXCLUDED.total,status='paid',paid_at=NOW()", [company.id, billingMonth, JSON.stringify(items), subtotal, tax, subtotal + tax]);
  await masterPool.query('UPDATE company_registration_requests SET company_id=?,hotel_id=?,admin_pin=?,setup_data=?,payment_reference=?,completed_at=NOW() WHERE id=?', [company.id, company.hotelId, company.adminPin, JSON.stringify(setupData), paymentReference, request.id]);

  const message = `KnockOUT registration complete. Hotel ID: ${company.hotelId}. New Admin PIN: ${company.adminPin}. Your subscription is active until ${expires.toLocaleDateString('en-IN')}.`;
  await queueNoticeFn(request.email, 'email', 'Your KnockOUT workspace is ready', message);
  await queueNoticeFn(request.phone, 'sms', 'KnockOUT access ready', message);
  broadcastChangeFn('master', 'registration.completed');

  res.status(201).json({ success: true, hotelId: company.hotelId, adminPin: company.adminPin, companyName: company.companyName, expiresAt: expires });
}

export async function postMasterLogin(req, res) {
  const [[user]] = await masterPool.query('SELECT id,name FROM master_users WHERE pin=? AND active=TRUE', [req.body.pin]);
  if (!user) return res.status(401).json({ message: 'Invalid KnockOUT Master PIN' });
  const result = { ...user, role: 'superadmin', companyDatabase: null };
  res.json({ ...result, accessToken: issuePortalToken(result) });
}

export async function getMasterState(_req, res) {
  await enforceSubscriptions();
  await generateMonthlySaasInvoices();
  const [companies] = await masterPool.query('SELECT id,company_name "companyName",database_name "databaseName",hotel_id "hotelId",modules,admin_name "adminName",email,phone,status,created_at "createdAt" FROM companies ORDER BY id');
  const [masterUsers] = await masterPool.query("SELECT id,name,pin,active,'superadmin' role FROM master_users ORDER BY name");
  const [registrationRequests] = await masterPool.query("SELECT id,company_name \"companyName\",hotel_id \"hotelId\",admin_name \"adminName\",email,phone,status,package_code \"packageCode\",period_months \"periodMonths\",selected_modules \"selectedModules\",review_note \"reviewNote\",company_id \"companyId\",created_at \"createdAt\",reviewed_at \"reviewedAt\",completed_at \"completedAt\" FROM company_registration_requests ORDER BY (CASE status WHEN 'pending' THEN 1 WHEN 'approved' THEN 2 WHEN 'rejected' THEN 3 ELSE 0 END),id DESC");
  const [invoices] = await masterPool.query('SELECT i.id,i.company_id "companyId",c.company_name "companyName",c.hotel_id "hotelId",to_char(i.billing_month, \'YYYY-MM\') "billingMonth",i.line_items "lineItems",i.subtotal,i.tax_rate "taxRate",i.tax,i.total,i.status,i.paid_at "paidAt",i.generated_at "generatedAt" FROM saas_invoices i JOIN companies c ON c.id=i.company_id ORDER BY i.billing_month DESC,c.company_name');
  const [subscriptions] = await masterPool.query('SELECT s.id,s.company_id "companyId",c.company_name "companyName",s.package_code "packageCode",s.period_months "periodMonths",s.started_at "startedAt",s.expires_at "expiresAt",s.grace_ends_at "graceEndsAt",s.status FROM tenant_subscriptions s JOIN companies c ON c.id=s.company_id ORDER BY s.id DESC');
  const [usage] = await masterPool.query('SELECT company_id "companyId",COUNT(*) "totalLogins",COUNT(DISTINCT user_id) "uniqueUsers",MAX(logged_in_at) "lastLogin" FROM usage_logins GROUP BY company_id');

  res.json({
    companies: await Promise.all(companies.map(companySummary)),
    masterUsers,
    registrationRequests: registrationRequests.map(request => ({
      ...request,
      selectedModules: typeof request.selectedModules === 'string' ? JSON.parse(request.selectedModules) : request.selectedModules || []
    })),
    invoices: invoices.map(invoice => ({
      ...invoice,
      lineItems: typeof invoice.lineItems === 'string' ? JSON.parse(invoice.lineItems) : invoice.lineItems,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      total: Number(invoice.total)
    })),
    subscriptions,
    usage,
    moduleCatalog: Object.fromEntries(Object.entries(moduleCatalog).map(([key, [name, price]]) => [key, { name, price }])),
    masterName: 'KnockOUT Master'
  });
}

export async function createCompany(req, res) {
  res.status(201).json(await provisionCompany(req.body));
}

export async function approveRegistration(req, res) {
  const [[request]] = await masterPool.query('SELECT id,company_name "companyName",email,phone,status FROM company_registration_requests WHERE id=?', [req.params.id]);
  if (!request) return res.status(404).json({ message: 'Registration request not found' });
  if (request.status !== 'pending') return res.status(409).json({ message: `This registration is already ${request.status}` });

  await masterPool.query("UPDATE company_registration_requests SET status='approved',review_note=?,reviewed_at=NOW() WHERE id=?", [String(req.body.reviewNote || ''), request.id]);
  await queueNoticeFn(request.email, 'email', 'KnockOUT application approved', `Your application for ${request.companyName} is approved. Sign in with your temporary PIN to complete setup and payment.`);
  if (request.phone) await queueNoticeFn(request.phone, 'sms', 'Application approved', `KnockOUT approved ${request.companyName}. Use your temporary PIN to finish registration.`);
  broadcastChangeFn('master', 'registration.approved');
  res.json({ ok: true, status: 'approved', request });
}

export async function updateCompanyModules(req, res) {
  const key = String(req.body.module || '');
  const enabled = req.body.enabled;
  if (!(key in defaultModules) || typeof enabled !== 'boolean') return res.status(400).json({ message: 'Invalid module setting' });

  const [[company]] = await masterPool.query('SELECT database_name "databaseName",modules FROM companies WHERE id=?', [req.params.id]);
  if (!company) return res.status(404).json({ message: 'Company not found' });

  const modules = { ...parseModules(company.modules), [key]: enabled };
  await masterPool.query('UPDATE companies SET modules=? WHERE id=?', [JSON.stringify(modules), req.params.id]);
  broadcastChangeFn(company.databaseName, 'company.modules', { modules, changedModule: key, enabled });
  res.json({ ok: true, modules });
}

export async function updateInvoiceStatus(req, res) {
  if (!['due', 'paid'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid invoice status' });
  const [result] = await masterPool.query("UPDATE saas_invoices SET status=?,paid_at=(CASE WHEN ?='paid' THEN NOW() ELSE NULL END) WHERE id=?", [req.body.status, req.body.status, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Invoice not found' });
  broadcastChangeFn('master', 'saas.billing');
  res.json({ ok: true, status: req.body.status });
}

export async function rejectRegistration(req, res) {
  const [result] = await masterPool.query("UPDATE company_registration_requests SET status='rejected',review_note=?,reviewed_at=NOW() WHERE id=? AND status='pending'", [String(req.body.reviewNote || 'Not approved by Master'), req.params.id]);
  if (!result.affectedRows) return res.status(409).json({ message: 'Registration request is missing or already reviewed' });
  res.json({ ok: true, status: 'rejected' });
}

export async function updateCompanyStatus(req, res) {
  if (!['active', 'suspended'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid company status' });
  const [[company]] = await masterPool.query('SELECT company_name "companyName",database_name "databaseName" FROM companies WHERE id=?', [req.params.id]);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  await masterPool.query('UPDATE companies SET status=? WHERE id=?', [req.body.status, req.params.id]);
  broadcastChangeFn(company.databaseName, 'company.status');
  res.json({ ok: true, status: req.body.status, companyName: company.companyName, loginsEnabled: req.body.status === 'active' });
}

export async function updateCompanyUserPin(req, res) {
  const pin = String(req.body.pin || '');
  if (!/^[0-9]{6}$/.test(pin)) return res.status(400).json({ message: 'PIN must contain exactly 6 digits' });

  const [[company]] = await masterPool.query('SELECT id,company_name "companyName",database_name "databaseName" FROM companies WHERE id=?', [req.params.companyId]);
  if (!company || !validTenant(company.databaseName)) return res.status(404).json({ message: 'Company not found' });

  const [[user]] = await adminPool.query(`SELECT id,name FROM "${company.databaseName}".users WHERE id=? AND deleted_at IS NULL`, [req.params.userId]);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const [[used]] = await adminPool.query(`SELECT id,name FROM "${company.databaseName}".users WHERE pin=? AND id<>? AND deleted_at IS NULL LIMIT 1`, [pin, user.id]);
  if (used) return res.status(409).json({ message: `This PIN is already assigned to ${used.name} in ${company.companyName}` });

  await adminPool.query(`UPDATE "${company.databaseName}".users SET pin=? WHERE id=?`, [pin, user.id]);
  await syncCompanyUsers(company.databaseName);
  res.json({ ok: true, userId: user.id, name: user.name, pin });
}

export async function updateMasterUserPin(req, res) {
  const pin = String(req.body.pin || '');
  if (!/^[0-9]{6}$/.test(pin)) return res.status(400).json({ message: 'PIN must contain exactly 6 digits' });

  const [[user]] = await masterPool.query('SELECT id,name FROM master_users WHERE id=?', [req.params.userId]);
  if (!user) return res.status(404).json({ message: 'Master user not found' });

  const matches = await findPortalLogins(null, pin, true);
  const used = matches.find(match => match.role !== 'superadmin' || Number(match.id) !== Number(user.id));
  if (used) return res.status(409).json({ message: `This PIN is already assigned to ${used.name} at ${used.companyName}` });

  await masterPool.query('UPDATE master_users SET pin=? WHERE id=?', [pin, user.id]);
  res.json({ ok: true, userId: user.id, name: user.name, pin });
}

export async function deleteCompany(req, res) {
  const [[company]] = await masterPool.query('SELECT id,company_name "companyName",database_name "databaseName" FROM companies WHERE id=?', [req.params.id]);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  if (company.databaseName === 'knockout') return res.status(409).json({ message: 'The protected primary tenant cannot be deleted' });
  if (!validTenant(company.databaseName)) return res.status(400).json({ message: 'Invalid tenant database' });
  if (req.body.companyName !== company.companyName) return res.status(400).json({ message: 'Type the exact hotel name to confirm deletion' });

  await adminPool.query(`DROP SCHEMA "${company.databaseName}" CASCADE`);
  await masterPool.query('DELETE FROM companies WHERE id=?', [company.id]);
  res.json({ ok: true, deleted: company.companyName });
}

export async function getModulePricing(_req, res) {
  res.json(await currentPricing());
}

export async function updateModulePrice(req, res) {
  const key = String(req.params.key);
  const price = Number(req.body.price);
  if (!(key in moduleCatalog) || !Number.isFinite(price) || price < 0) return res.status(400).json({ message: 'Enter a valid module price' });

  await masterPool.query('UPDATE module_pricing SET monthly_price=? WHERE module_key=?', [price, key]);
  await generateMonthlySaasInvoices();
  broadcastChangeFn('master', 'saas.pricing');
  res.json({ ok: true, key, price });
}

export async function postReport(req, res) {
  const { putReport, storageProvider } = await import('../storage.js');
  if (!req.body.filename || typeof req.body.content !== 'string') return res.status(400).json({ message: 'Report filename and content are required' });
  const stored = await putReport('knockout', req.body.filename, req.body.content, req.body.contentType || 'text/csv;charset=utf-8');
  res.status(201).json({ ...stored, provider: storageProvider });
}
