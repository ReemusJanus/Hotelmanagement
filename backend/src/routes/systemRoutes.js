import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as systemController from '../controllers/systemController.js';

const router = express.Router();

router.get('/live', systemController.getLive);
router.get('/health', asyncRoute(systemController.getHealth));
router.get('/state', asyncRoute(systemController.getStateData));

export default router;
