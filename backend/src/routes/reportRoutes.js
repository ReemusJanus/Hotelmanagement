import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as reportController from '../controllers/reportController.js';

const router = express.Router();

router.post('/', asyncRoute(reportController.createReport));

export default router;
