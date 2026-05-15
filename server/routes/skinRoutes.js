import express from 'express';
const router = express.Router();
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { getAllSkins } from '../controllers/skinController.js';

/**
 * @swagger
 * /api/skins:
 *   get:
 *     summary: Get all skins
 *     tags: [Skins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of skins
 */
router.get('/', isAuthenticated, getAllSkins);

export default router;