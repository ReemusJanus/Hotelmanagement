import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as staffController from '../controllers/staffController.js';

const router = express.Router();

router.post('/', asyncRoute(staffController.createKitchenStaff));
router.put('/:id', asyncRoute(staffController.updateKitchenStaff));
router.delete('/:id', asyncRoute(staffController.deleteKitchenStaff));

export default router;
