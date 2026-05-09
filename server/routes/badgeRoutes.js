import express from 'express';
const router = express.Router();
import { BADGE_DICTIONARY } from '../constants/badges.js';

// GET /api/badges
/**
 * @swagger
 * /api/badges:
 *   get:
 *     summary: Get all badges
 *     tags: [Badges]
 *     responses:
 *       200:
 *         description: Badge dictionary
 */
router.get('/', (req, res) => {
  try {
    res.json(BADGE_DICTIONARY);
  } catch (err) {
    console.error('Error fetching badges:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

