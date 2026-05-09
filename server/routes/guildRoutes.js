import express from 'express';
const router  = express.Router();
import { isAuthenticated } from '../middleware/authMiddleware.js';
import {
  createGuild,
  joinGuild,
  leaveGuild,
  getAllGuilds,
  getGuildById,
  getMyGuild,
  getGuildLeaderboard,
} from '../controllers/guildController.js';

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

export default router;

