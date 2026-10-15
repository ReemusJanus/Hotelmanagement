import express from 'express';
import { runWithTenant } from './database.js';
import routes from './routes/index.js';
import { clearStateCache } from './controllers/systemController.js';

export function createRoleRouter(portalRole, { onMutation = async () => {} } = {}) {
  if (!['admin', 'waiter', 'chef', 'juicer'].includes(portalRole)) {
    throw new Error('Invalid portal role');
  }
  const app = express.Router();

  // Unified gateway session verification
  app.use((req, res, next) => {
    if (!req.portalSession || req.portalSession.role !== portalRole) {
      return res.status(401).json({ message: 'A verified portal session is required' });
    }
    const originalJson = res.json.bind(res);
    res.json = body => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || res.statusCode >= 400) {
        return originalJson(body);
      }
      clearStateCache(req.portalSession.companyDatabase);
      Promise.resolve(onMutation(req)).then(() => originalJson(body)).catch(next);
      return res;
    };
    next();
  });

  app.use((req, _res, next) => {
    const requested = req.portalSession.companyDatabase;
    const database = /^(?:knockout(?:_[0-9]+)?|tenant_[a-z][a-z0-9_]{1,54})$/.test(requested)
      ? requested
      : (process.env.DB_NAME || 'knockout');
    req.portalRole = portalRole;
    runWithTenant(database, next);
  });

  // Mount all modular routes
  app.use(routes);

  // Centralized error handler
  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  });

  return app;
}
