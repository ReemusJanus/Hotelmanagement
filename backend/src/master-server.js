import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { createPool } from './postgres.js';
import { ensureSchema, tenantDDL, masterDDL } from './schema.js';
import { migrate, closePools } from './database.js';
import { initializeStorage, ensureStorageFolders } from './storage.js';
import { initializeRealtime, publishRealtime, closeRealtime } from './realtime.js';

import {
  validTenant,
  defaultModules,
  moduleCatalog,
  verifyPortalToken
} from './middleware/auth.js';
import { errorHandler } from './middleware/tenant.js';

import masterRoutes from './routes/master.routes.js';
import { createRoleRouter } from './routes/portal.routes.js';

import {
  initMasterController,
  syncCompanyUsers,
  ensureDailyFinanceTables,
  migrateTenantImages,
  generateMonthlySaasInvoices
} from './controllers/master.controller.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const masterDb = process.env.MASTER_DB_NAME || 'knockout_master';
const server = http.createServer(app);
const socketServer = new WebSocketServer({ server, path: '/ws' });

const rootConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'knockout',
  password: process.env.DB_PASSWORD || 'knockout_pass',
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000)
};

let adminPool, masterPool;

app.use(cors());
app.use(express.json({ limit: '6mb' }));

const socketDatabase = value => validTenant(value) ? String(value) : value === 'master' ? 'master' : null;

function broadcastChange(database, resource = 'state', details = {}) {
  const event = { type: 'state.changed', database, resource, ...details, at: new Date().toISOString() };
  const message = JSON.stringify(event);
  for (const client of socketServer.clients) {
    if (client.readyState === WebSocket.OPEN && (client.database === database || client.database === 'master')) {
      client.send(message);
    }
  }
  publishRealtime(event);
}

function relayChange(event) {
  const message = JSON.stringify(event);
  for (const client of socketServer.clients) {
    if (client.readyState === WebSocket.OPEN && (client.database === event.database || client.database === 'master')) {
      client.send(message);
    }
  }
}

async function queueNotice(recipient, channel, subject, message) {
  await masterPool.query('INSERT INTO notification_outbox (recipient,channel,subject,message) VALUES (?,?,?,?)', [recipient, channel, subject, message]);
  const url = process.env.NOTIFICATION_WEBHOOK_URL;
  if (url) {
    fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recipient, channel, subject, message })
    }).catch(() => {});
  }
}

socketServer.on('connection', (socket, request) => {
  const params = new URL(request.url, 'http://localhost').searchParams;
  const database = socketDatabase(params.get('database'));
  const session = verifyPortalToken(params.get('token'));
  const authorized = database === 'master'
    ? session?.role === 'superadmin'
    : session?.companyDatabase === database && ['admin', 'waiter', 'chef', 'juicer'].includes(session?.role);

  if (!database || !authorized) return socket.close(1008, 'Unauthorized live tracking channel');
  socket.database = database;
  socket.isAlive = true;
  socket.on('pong', () => { socket.isAlive = true; });
  socket.send(JSON.stringify({ type: 'connected', database, at: new Date().toISOString() }));
});

const socketHeartbeat = setInterval(() => {
  for (const socket of socketServer.clients) {
    if (socket.isAlive === false) {
      socket.terminate();
      continue;
    }
    socket.isAlive = false;
    socket.ping();
  }
}, 25000);
socketServer.on('close', () => clearInterval(socketHeartbeat));

// State change broadcast hook on successful mutations
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || ['/api/login', '/api/public/resolve-login'].includes(req.path)) {
    return next();
  }
  res.on('finish', () => {
    if (res.statusCode < 400) {
      const database = req.portalSession?.companyDatabase || 'master';
      broadcastChange(database, req.path);
    }
  });
  next();
});

// Role-based portal routers
const roleRouters = Object.fromEntries(
  ['admin', 'waiter', 'chef', 'juicer'].map(role => [
    role,
    createRoleRouter(role, {
      onMutation: async req => {
        if (/^\/api\/staff(?:\/|$)/.test(req.originalUrl) || ['/api/juicer-login', '/api/profile'].includes(req.path)) {
          await syncCompanyUsers(req.portalSession.companyDatabase);
        }
      }
    })
  ])
);

// Portal dispatch middleware under /api
app.use('/api', async (req, res, next) => {
  const session = verifyPortalToken(req.headers.authorization);
  const role = session?.role || '';
  const portalHeader = String(req.headers['x-portal-role'] || '').toLowerCase();

  if (!session && ['admin', 'waiter', 'chef', 'juicer'].includes(portalHeader) && !['/public/resolve-login', '/login'].includes(req.path)) {
    return res.status(401).json({ message: 'Your secure session has expired. Sign in with your PIN again.' });
  }

  if (!['admin', 'waiter', 'chef', 'juicer'].includes(role)) {
    return next();
  }

  const [[company]] = await masterPool.query('SELECT status,modules FROM companies WHERE database_name=? LIMIT 1', [session.companyDatabase]);
  if (!company || company.status !== 'active') {
    return res.status(403).json({ code: 'COMPANY_SUSPENDED', message: 'This company has been suspended by KnockOUT Master. All company logins are temporarily disabled.' });
  }

  const { parseModules } = await import('./middleware/auth.js');
  const modules = parseModules(company.modules);
  const path = req.path;
  const moduleKey = path.startsWith('/bookings')
    ? 'bookings'
    : path.startsWith('/tables')
    ? 'tables'
    : path.startsWith('/finance') || path.startsWith('/supplier-')
    ? 'finance'
    : path.startsWith('/inventory') || path.startsWith('/stock-')
    ? 'stock'
    : path.startsWith('/menu') || path.startsWith('/combos')
    ? 'menu'
    : path.startsWith('/staff') || path.startsWith('/attendance') || path.startsWith('/kitchen-staff')
    ? 'staff'
    : null;

  if (path === '/session') return res.json({ modules, companyDatabase: session.companyDatabase, role });
  if ((role === 'chef' && !modules.kitchen) || (role === 'juicer' && !modules.juicer) || (moduleKey && !modules[moduleKey])) {
    return res.status(403).json({ code: 'MODULE_DISABLED', message: 'This module is disabled for your hotel by KnockOUT Master.' });
  }

  req.portalSession = session;
  req.headers['x-company-database'] = session.companyDatabase;
  req.headers['x-portal-role'] = role;
  req.headers['x-portal-user-id'] = String(session.id);

  const previousUrl = req.url;
  req.url = '/api' + req.url;
  return roleRouters[role](req, res, error => {
    req.url = previousUrl;
    if (error) return next(error);
    res.status(404).json({ message: 'Unknown portal API route' });
  });
});

// Master routes authentication check for master endpoints
app.use('/api', (req, res, next) => {
  if (['/live', '/health', '/framework', '/login', '/public/companies', '/public/resolve-login', '/public/company-registrations', '/public/onboarding-status', '/public/complete-registration'].includes(req.path)) {
    return next();
  }
  const session = verifyPortalToken(req.headers.authorization);
  if (session?.role !== 'superadmin') {
    return res.status(401).json({ message: 'KnockOUT Master approval is required' });
  }
  next();
});

// Mount master routes
app.use('/api', masterRoutes);

// Compatibility route for framework check
app.get('/api/framework', (_req, res) => {
  res.json({
    ok: true,
    framework: 'Express',
    service: 'knockout-api',
    architecture: 'single-process-multi-tenant'
  });
});

// Global error handler
app.use(errorHandler);

async function initialize() {
  adminPool = createPool({
    ...rootConfig,
    waitForConnections: true,
    connectionLimit: Number(process.env.MASTER_ADMIN_POOL_SIZE || 20),
    maxIdle: Number(process.env.DB_POOL_MAX_IDLE || 10),
    idleTimeout: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 60000),
    queueLimit: Number(process.env.DB_QUEUE_LIMIT || 500)
  });

  masterPool = createPool({
    ...rootConfig,
    database: masterDb,
    connectionLimit: Number(process.env.MASTER_DB_POOL_SIZE || 30)
  });

  initMasterController({ masterPool, adminPool, broadcastChange, queueNotice });

  const initConnection = await adminPool.getConnection();
  try {
    await initConnection.beginTransaction();
    await initConnection.query('SELECT pg_advisory_xact_lock(742918)');
    await ensureSchema(initConnection, 'knockout', tenantDDL);
    await ensureSchema(initConnection, masterDb, masterDDL);
    await initConnection.commit();
  } catch (error) {
    await initConnection.rollback();
    throw error;
  } finally {
    initConnection.release();
  }

  for (const [key, [name, price]] of Object.entries(moduleCatalog)) {
    await masterPool.query('INSERT INTO module_pricing (module_key,module_name,monthly_price) VALUES (?,?,?) ON CONFLICT DO NOTHING', [key, name, price]);
  }

  const [[masterCount]] = await masterPool.query('SELECT COUNT(*) count FROM master_users');
  if (!masterCount.count && process.env.MASTER_BOOTSTRAP_PIN) {
    await masterPool.query("INSERT INTO master_users (name,pin) VALUES ('KnockOUT Master',?)", [process.env.MASTER_BOOTSTRAP_PIN]);
  }

  if (process.env.SEED_DEMO_DATA === 'true') {
    await masterPool.query("INSERT INTO companies (company_name,database_name,cy_db,admin_name,email,status) VALUES ('KnockOUT 1','knockout','knockout','Arjun Kumar','admin@knockout1.local','active') ON CONFLICT DO NOTHING");
  }

  await masterPool.query("UPDATE companies SET hotel_id=CASE WHEN database_name='knockout' THEN '1234' ELSE lpad((2000+id)::text,4,'0') END WHERE hotel_id IS NULL");
  await masterPool.query('UPDATE companies SET modules=? WHERE modules IS NULL', [JSON.stringify(defaultModules)]);

  const [companies] = await masterPool.query('SELECT database_name "databaseName" FROM companies');
  for (const company of companies) {
    await ensureDailyFinanceTables(company.databaseName);
    await syncCompanyUsers(company.databaseName);
  }

  try {
    await initializeStorage();
    const [storageCompanies] = await masterPool.query('SELECT company_name "companyName",database_name "databaseName" FROM companies');
    for (const company of storageCompanies) {
      await ensureStorageFolders(company.companyName);
      await migrateTenantImages(company);
    }
  } catch (error) {
    if (process.env.STORAGE_REQUIRED === 'true') throw error;
    console.error(`Storage unavailable; continuing without object storage: ${error.message}`);
  }

  await generateMonthlySaasInvoices();
}

async function start() {
  try {
    if (process.env.RUN_MIGRATIONS !== 'false') await migrate();
    await initialize();
    try {
      await initializeRealtime(relayChange);
    } catch (error) {
      if (process.env.REDIS_REQUIRED === 'true') throw error;
      console.error(`Redis unavailable; using single-instance realtime: ${error.message}`);
    }

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '0.0.0.0', resolve);
    });
    console.log(`KnockOUT unified API + WebSocket on http://localhost:${port}`);
    if (process.send) process.send('ready');
  } catch (error) {
    console.error('Backend startup failed:', error);
    await shutdown('startup failure', 1);
  }
}

let stopping = false;
async function shutdown(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  console.log(`${signal}: draining unified backend`);
  const timeout = setTimeout(() => process.exit(1), 30000);
  timeout.unref();
  clearInterval(socketHeartbeat);
  for (const socket of socketServer.clients) socket.terminate();
  socketServer.close();
  await new Promise(resolve => server.close(resolve));
  await Promise.allSettled([closeRealtime(), masterPool?.end(), adminPool?.end(), closePools()]);
  clearTimeout(timeout);
  process.exit(exitCode);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

export { app, server };
