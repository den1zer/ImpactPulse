import express from 'express';
const router = express.Router();
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { getTodayQuests, claimRewards } from '../controllers/questController.js';

// GET /api/quests/daily
/**
 * @swagger
 * /api/quests/daily:
 *   get:
 *     summary: Get today's daily quests
 *     tags: [Quests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of daily quests
 */
router.get('/daily', isAuthenticated, getTodayQuests);

// POST /api/quests/claim
/**
 * @swagger
 * /api/quests/claim:
 *   post:
 *     summary: Claim quest rewards
 *     tags: [Quests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rewards claimed successfully
 */
router.post('/claim', isAuthenticated, claimRewards);

export default router;

