import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as parcelController from '../controllers/parcelController.js';

const router = express.Router();

router.post('/', asyncRoute(parcelController.createParcel));

export default router;
