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
/**
 * @swagger
 * /api/guilds:
 *   get:
 *     summary: Get all guilds
 *     tags: [Guilds]
 *     responses:
 *       200:
 *         description: List of guilds
 */
router.get('/',              getAllGuilds);

/**
 * @swagger
 * /api/guilds/leaderboard:
 *   get:
 *     summary: Get guild leaderboard
 *     tags: [Guilds]
 *     responses:
 *       200:
 *         description: Guild leaderboard
 */
router.get('/leaderboard',   getGuildLeaderboard);

// Protected routes (must be before /:id)
/**
 * @swagger
 * /api/guilds/my/guild:
 *   get:
 *     summary: Get current user's guild
 *     tags: [Guilds]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's guild data
 */
router.get('/my/guild',      isAuthenticated, getMyGuild);

/**
 * @swagger
 * /api/guilds:
 *   post:
 *     summary: Create a new guild
 *     tags: [Guilds]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Guild created successfully
 */
router.post('/',             isAuthenticated, createGuild);

// Dynamic param routes (public)
/**
 * @swagger
 * /api/guilds/{id}:
 *   get:
 *     summary: Get guild by ID
 *     tags: [Guilds]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Guild data
 */
router.get('/:id',           getGuildById);

// Dynamic param routes (protected)
/**
 * @swagger
 * /api/guilds/{id}/join:
 *   post:
 *     summary: Join a guild
 *     tags: [Guilds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined guild successfully
 */
router.post('/:id/join',     isAuthenticated, joinGuild);

/**
 * @swagger
 * /api/guilds/{id}/leave:
 *   post:
 *     summary: Leave a guild
 *     tags: [Guilds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Left guild successfully
 */
router.post('/:id/leave',    isAuthenticated, leaveGuild);

export default router;

