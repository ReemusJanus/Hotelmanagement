import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as staffController from '../controllers/staffController.js';

const router = express.Router();

router.get('/', asyncRoute(staffController.getJuicerLogin));
router.post('/', asyncRoute(staffController.createJuicerLogin));

export default router;
