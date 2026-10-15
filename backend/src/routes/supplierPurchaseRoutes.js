import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as financeController from '../controllers/financeController.js';

const router = express.Router();

router.post('/', asyncRoute(financeController.createSupplierPurchase));
router.post('/:id/payments', asyncRoute(financeController.addSupplierPayment));
router.delete('/:id', asyncRoute(financeController.deleteSupplierPurchase));

export default router;
