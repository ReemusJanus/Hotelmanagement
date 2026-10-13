import express from 'express';
import { uploadSingleImage } from '../uploads/multer.js';
import { asyncRoute, tenantContextMiddleware } from '../middleware/tenant.js';
import * as tenantController from '../controllers/tenant.controller.js';

export function createRoleRouter(portalRole, { onMutation = async () => {} } = {}) {
  if (!['admin', 'waiter', 'chef', 'juicer'].includes(portalRole)) {
    throw new Error('Invalid portal role');
  }

  const router = express.Router();

  // Mutation and cache eviction hook
  router.use((req, res, next) => {
    if (!req.portalSession || req.portalSession.role !== portalRole) {
      return res.status(401).json({ message: 'A verified portal session is required' });
    }
    const originalJson = res.json.bind(res);
    res.json = body => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || res.statusCode >= 400) {
        return originalJson(body);
      }
      tenantController.clearStateCache(req.portalSession.companyDatabase);
      Promise.resolve(onMutation(req)).then(() => originalJson(body)).catch(next);
      return res;
    };
    next();
  });

  // Apply tenant search_path context
  router.use(tenantContextMiddleware);

  // Common role routes
  router.get('/api/live', tenantController.getLive);
  router.get('/api/health', asyncRoute(tenantController.getHealth));
  router.get('/api/state', asyncRoute(tenantController.getStateController));
  router.post('/api/login', asyncRoute(tenantController.postLogin));
  router.get('/api/profile', asyncRoute(tenantController.getProfile));
  router.patch('/api/profile', uploadSingleImage, asyncRoute(tenantController.patchProfile));

  // Bookings
  router.post('/api/bookings', asyncRoute(tenantController.createBooking));
  router.delete('/api/bookings/:id', asyncRoute(tenantController.deleteBooking));

  // Orders
  router.post('/api/orders', asyncRoute(tenantController.createOrder));
  router.post('/api/orders/:id/items', asyncRoute(tenantController.addOrderItems));
  router.patch('/api/orders/:id/items/status', asyncRoute(tenantController.updateOrderItemStatus));
  router.patch('/api/orders/:id/batches/:batchNo/handoff', asyncRoute(tenantController.updateBatchHandoff));
  router.patch('/api/orders/:id/status', asyncRoute(tenantController.updateOrderStatus));
  router.post('/api/orders/:id/request-bill', asyncRoute(tenantController.requestBill));
  router.get('/api/orders/:id/bill', asyncRoute(tenantController.getOrderBill));
  router.post('/api/orders/:id/finalize', asyncRoute(tenantController.finalizeOrder));

  // Parcels
  router.post('/api/parcels', asyncRoute(tenantController.createParcel));
  router.post('/api/orders/:id/mark-paid', asyncRoute(tenantController.markOrderPaid));

  // Tables
  router.patch('/api/tables/:id/status', asyncRoute(tenantController.updateTableStatus));
  router.post('/api/tables', asyncRoute(tenantController.createTable));
  router.delete('/api/tables/:id', asyncRoute(tenantController.deleteTable));

  // Inventory
  router.post('/api/inventory', asyncRoute(tenantController.createInventoryItem));
  router.put('/api/inventory/:id', asyncRoute(tenantController.updateInventoryItem));
  router.post('/api/inventory/:id/movements', asyncRoute(tenantController.addInventoryMovement));
  router.delete('/api/inventory/:id', asyncRoute(tenantController.deleteInventoryItem));
  router.post('/api/stock-requests', asyncRoute(tenantController.createStockRequest));
  router.patch('/api/stock-requests/:id/status', asyncRoute(tenantController.updateStockRequestStatus));

  // Finance & Suppliers
  router.post('/api/finance', asyncRoute(tenantController.createFinanceEntry));
  router.delete('/api/finance/:id', asyncRoute(tenantController.deleteFinanceEntry));
  router.post('/api/supplier-purchases', asyncRoute(tenantController.createSupplierPurchase));
  router.post('/api/supplier-purchases/:id/payments', asyncRoute(tenantController.createSupplierPayment));
  router.delete('/api/supplier-purchases/:id', asyncRoute(tenantController.deleteSupplierPayment));

  // Settings
  router.put('/api/settings', asyncRoute(tenantController.updateSettings));

  // Attendance
  router.get('/api/attendance/:id', asyncRoute(tenantController.getAttendance));
  router.post('/api/attendance/:id/check-in', asyncRoute(tenantController.checkInSelf));
  router.post('/api/attendance/:id/check-out', asyncRoute(tenantController.checkOutSelf));
  router.post('/api/staff/:id/check-in', asyncRoute(tenantController.adminCheckInStaff));
  router.post('/api/staff/:id/check-out', asyncRoute(tenantController.adminCheckOutStaff));

  // Staff Management
  router.post('/api/staff', asyncRoute(tenantController.createStaff));
  router.put('/api/staff/:id', asyncRoute(tenantController.updateStaff));
  router.delete('/api/staff/:id', asyncRoute(tenantController.deleteStaff));

  // Juicer Login
  router.get('/api/juicer-login', asyncRoute(tenantController.getJuicerLogin));
  router.post('/api/juicer-login', asyncRoute(tenantController.createJuicerLogin));

  // Kitchen Staff
  router.post('/api/kitchen-staff', asyncRoute(tenantController.createKitchenStaff));
  router.put('/api/kitchen-staff/:id', asyncRoute(tenantController.updateKitchenStaff));
  router.delete('/api/kitchen-staff/:id', asyncRoute(tenantController.deleteKitchenStaff));

  // Menu Items & Combos
  router.post('/api/menu', asyncRoute(tenantController.createMenuItem));
  router.put('/api/menu/:id', asyncRoute(tenantController.updateMenuItem));
  router.delete('/api/menu/:id', asyncRoute(tenantController.deleteMenuItem));
  router.patch('/api/menu/:id/availability', asyncRoute(tenantController.updateMenuItemAvailability));
  router.post('/api/combos', asyncRoute(tenantController.createCombo));
  router.put('/api/combos/:id', asyncRoute(tenantController.updateCombo));
  router.post('/api/menu/:id/image', uploadSingleImage, asyncRoute(tenantController.uploadMenuImage));
  router.delete('/api/menu/:id/image', asyncRoute(tenantController.deleteMenuImage));
  router.post('/api/reports', asyncRoute(tenantController.uploadReport));

  return router;
}

export default createRoleRouter;
