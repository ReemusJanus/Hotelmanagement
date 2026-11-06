import { pool, runWithTenant } from '../database.js';
import { verifyPortalToken, parseModules } from './auth.js';

export const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Middleware ensuring valid master / superadmin token
 */
export function requireSuperadmin(req, res, next) {
  const session = verifyPortalToken(req.headers.authorization);
  if (session?.role !== 'superadmin') {
    return res.status(401).json({ message: 'KnockOUT Master approval is required' });
  }
  req.portalSession = session;
  next();
}

/**
 * Gateway middleware for role-based portal endpoints under /api
 */
export function createPortalAuthMiddleware({ masterPool, onMutation = async () => {} }) {
  return asyncRoute(async (req, res, next) => {
    const session = verifyPortalToken(req.headers.authorization);
    const role = session?.role || '';
    const portalHeader = String(req.headers['x-portal-role'] || '').toLowerCase();

    if (!session && ['admin', 'waiter', 'chef', 'juicer'].includes(portalHeader) && !['/public/resolve-login', '/login'].includes(req.path)) {
      return res.status(401).json({ message: 'Your secure session has expired. Sign in with your PIN again.' });
    }

    if (!['admin', 'waiter', 'chef', 'juicer'].includes(role)) {
      return next();
    }

    const [[company]] = await masterPool.query(
      'SELECT status, modules FROM companies WHERE database_name=? LIMIT 1',
      [session.companyDatabase]
    );

    if (!company || company.status !== 'active') {
      return res.status(403).json({
        code: 'COMPANY_SUSPENDED',
        message: 'This company has been suspended by KnockOUT Master. All company logins are temporarily disabled.'
      });
    }

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

    if (path === '/session') {
      return res.json({ modules, companyDatabase: session.companyDatabase, role });
    }

    if ((role === 'chef' && !modules.kitchen) || (role === 'juicer' && !modules.juicer) || (moduleKey && !modules[moduleKey])) {
      return res.status(403).json({
        code: 'MODULE_DISABLED',
        message: 'This module is disabled for your hotel by KnockOUT Master.'
      });
    }

    req.portalSession = session;
    req.headers['x-company-database'] = session.companyDatabase;
    req.headers['x-portal-role'] = role;
    req.headers['x-portal-user-id'] = String(session.id);

    next();
  });
}

/**
 * Tenant scoping middleware that attaches the PostgreSQL search_path context
 */
export function tenantContextMiddleware(req, _res, next) {
  const requested = req.portalSession?.companyDatabase || req.headers['x-company-database'];
  const database = /^(?:knockout(?:_[0-9]+)?|tenant_[a-z][a-z0-9_]{1,54})$/.test(requested)
    ? requested
    : (process.env.DB_NAME || 'knockout');
  runWithTenant(database, next);
}

/**
 * Standard error handling middleware
 */
export function errorHandler(error, _req, res, _next) {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Server error' });
}
