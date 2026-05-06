const express = require('express');
const router  = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const {
  createGuild,
  joinGuild,
  leaveGuild,
  getAllGuilds,
  getGuildById,
  getMyGuild,
  getGuildLeaderboard,
} = require('../controllers/guildController');

// Public routes (order matters: specific before dynamic)
router.get('/',              getAllGuilds);
router.get('/leaderboard',   getGuildLeaderboard);

// Protected routes (must be before /:id)
router.get('/my/guild',      isAuthenticated, getMyGuild);
router.post('/',             isAuthenticated, createGuild);

// Dynamic param routes (public)
router.get('/:id',           getGuildById);

// Dynamic param routes (protected)
router.post('/:id/join',     isAuthenticated, joinGuild);
router.post('/:id/leave',    isAuthenticated, leaveGuild);

module.exports = router;
