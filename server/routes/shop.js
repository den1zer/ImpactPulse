import express from 'express';
const router = express.Router();
import * as shopController from '../controllers/shopController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

router.get('/', isAuthenticated, shopController.getAllItems);
router.post('/buy', isAuthenticated, shopController.buyItem);

export default router;

