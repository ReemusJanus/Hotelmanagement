import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as orderController from '../controllers/orderController.js';
import { markParcelPaid } from '../controllers/parcelController.js';

const router = express.Router();

router.post('/', asyncRoute(orderController.createOrder));
router.post('/:id/items', asyncRoute(orderController.addOrderItems));
router.patch('/:id/items/status', asyncRoute(orderController.updateItemsStatus));
router.patch('/:id/batches/:batchNo/handoff', asyncRoute(orderController.batchHandoff));
router.patch('/:id/status', asyncRoute(orderController.updateOrderStatus));
router.post('/:id/request-bill', asyncRoute(orderController.requestBill));
router.get('/:id/bill', asyncRoute(orderController.getOrderBill));
router.post('/:id/finalize', asyncRoute(orderController.finalizeOrder));
router.post('/:id/mark-paid', asyncRoute(markParcelPaid));

export default router;
