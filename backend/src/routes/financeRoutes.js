import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as financeController from '../controllers/financeController.js';

const router = express.Router();

router.post('/', asyncRoute(financeController.createFinanceEntry));
router.delete('/:id', asyncRoute(financeController.deleteFinanceEntry));

export default router;
