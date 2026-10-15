import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as stockRequestController from '../controllers/stockRequestController.js';

const router = express.Router();

router.post('/', asyncRoute(stockRequestController.createStockRequest));
router.patch('/:id/status', asyncRoute(stockRequestController.updateStockRequestStatus));

export default router;
