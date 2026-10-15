import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/login', asyncRoute(authController.login));
router.get('/profile', asyncRoute(authController.getProfile));
router.patch('/profile', authController.updateProfile[0], asyncRoute(authController.updateProfile[1]));

export default router;
