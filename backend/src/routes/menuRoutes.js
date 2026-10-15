import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as menuController from '../controllers/menuController.js';

const router = express.Router();

router.post('/', asyncRoute(menuController.createMenuItem));
router.put('/:id', asyncRoute(menuController.updateMenuItem));
router.delete('/:id', asyncRoute(menuController.deleteMenuItem));
router.patch('/:id/availability', asyncRoute(menuController.updateAvailability));
router.post('/:id/image', menuController.uploadMenuImage[0], asyncRoute(menuController.uploadMenuImage[1]));
router.delete('/:id/image', asyncRoute(menuController.deleteMenuImage));

export default router;
