import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as bookingController from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', asyncRoute(bookingController.createBooking));
router.delete('/:id', asyncRoute(bookingController.cancelBooking));

export default router;
