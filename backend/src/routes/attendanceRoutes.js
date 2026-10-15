import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as staffController from '../controllers/staffController.js';

const router = express.Router();

router.get('/:id', asyncRoute(staffController.getAttendance));
router.post('/:id/check-in', asyncRoute(staffController.selfCheckIn));
router.post('/:id/check-out', asyncRoute(staffController.selfCheckOut));

export default router;
