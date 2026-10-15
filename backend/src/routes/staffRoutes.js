import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as staffController from '../controllers/staffController.js';

const router = express.Router();

router.post('/', asyncRoute(staffController.createStaff));
router.put('/:id', asyncRoute(staffController.updateStaff));
router.delete('/:id', asyncRoute(staffController.deleteStaff));
router.post('/:id/check-in', asyncRoute(staffController.adminCheckInStaff));
router.post('/:id/check-out', asyncRoute(staffController.adminCheckOutStaff));

export default router;
