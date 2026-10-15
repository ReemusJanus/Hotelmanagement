import express from 'express';
import { asyncRoute } from '../utils/asyncHandler.js';
import * as tableController from '../controllers/tableController.js';

const router = express.Router();

router.post('/', asyncRoute(tableController.createTable));
router.delete('/:id', asyncRoute(tableController.deleteTable));
router.patch('/:id/status', asyncRoute(tableController.updateTableStatus));

export default router;
