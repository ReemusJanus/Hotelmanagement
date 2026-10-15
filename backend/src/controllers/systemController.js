import { pool, getState } from '../database.js';
import { storageProvider } from '../storage.js';

export const stateCache = new Map();
const stateCacheTtl = Math.max(100, Number(process.env.STATE_CACHE_TTL_MS || 1000));

export const clearStateCache = (database) => {
  if (database) {
    stateCache.delete(database);
  } else {
    stateCache.clear();
  }
};

export const getLive = (req, res) => {
  const { portalRole } = req;
  res.json({ ok: true, service: `knockout-${portalRole}-api` });
};

export const getHealth = async (req, res) => {
  const { portalRole } = req;
  await pool.query('SELECT 1');
  res.json({
    ok: true,
    service: `knockout-${portalRole}-api`,
    portal: portalRole,
    database: 'postgresql',
    storage: storageProvider,
  });
};

export const getStateData = async (req, res) => {
  const { portalRole } = req;
  const database = String(req.headers['x-company-database'] || process.env.DB_NAME || 'knockout');
  const now = Date.now();
  let cached = stateCache.get(database);
  if (!cached || cached.expiresAt <= now) {
    const promise = getState().catch(error => {
      stateCache.delete(database);
      throw error;
    });
    cached = { promise, expiresAt: now + stateCacheTtl };
    stateCache.set(database, cached);
  }
  const state = structuredClone(await cached.promise);
  state.companyDatabase = database;
  if (portalRole !== 'admin') {
    if (portalRole !== 'chef') {
      delete state.inventory;
      delete state.stockRequests;
    }
    delete state.inventoryTransactions;
    delete state.financeEntries;
    delete state.users;
    delete state.attendance;
  }
  res.set('Cache-Control', 'private, no-cache');
  res.json(state);
};
