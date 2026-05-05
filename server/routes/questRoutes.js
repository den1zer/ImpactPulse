const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { getTodayQuests, claimRewards } = require('../controllers/questController');

// GET /api/quests/daily
router.get('/daily', isAuthenticated, getTodayQuests);

// POST /api/quests/claim
router.post('/claim', isAuthenticated, claimRewards);

module.exports = router;
