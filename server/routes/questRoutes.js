import express from 'express';
const router = express.Router();
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { getTodayQuests, claimRewards } from '../controllers/questController.js';

// GET /api/quests/daily
router.get('/daily', isAuthenticated, getTodayQuests);

// POST /api/quests/claim
router.post('/claim', isAuthenticated, claimRewards);

export default router;

