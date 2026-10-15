import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as menuController from '../controllers/menuController.js';

const router = express.Router();

router.post('/', asyncRoute(menuController.createCombo));
router.put('/:id', asyncRoute(menuController.updateCombo));

export default router;
