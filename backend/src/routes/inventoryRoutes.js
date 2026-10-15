import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as inventoryController from '../controllers/inventoryController.js';

const router = express.Router();

router.post('/', asyncRoute(inventoryController.createInventory));
router.put('/:id', asyncRoute(inventoryController.updateInventory));
router.delete('/:id', asyncRoute(inventoryController.deleteInventory));
router.post('/:id/movements', asyncRoute(inventoryController.addInventoryMovement));

export default router;
