import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as financeController from '../controllers/financeController.js';

const router = express.Router();

router.put('/', asyncRoute(financeController.updateSettings));

export default router;
