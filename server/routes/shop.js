import express from 'express';
const router = express.Router();
import * as shopController from '../controllers/shopController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';

/**
 * @swagger
 * /api/shop:
 *   get:
 *     summary: Get all shop items
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of items
 */
router.get('/', isAuthenticated, shopController.getAllItems);

/**
 * @swagger
 * /api/shop/buy:
 *   post:
 *     summary: Buy an item from shop
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Item purchased successfully
 */
router.post('/buy', isAuthenticated, shopController.buyItem);

/**
 * @swagger
 * /api/shop/admin:
 *   post:
 *     summary: Create a new shop item (Admin)
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Item created successfully
 */
router.post('/admin', [isAuthenticated, uploadMiddleware.single('image')], shopController.createItem);

export default router;

