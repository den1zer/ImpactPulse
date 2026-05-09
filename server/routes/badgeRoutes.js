import express from 'express';
const router = express.Router();
import { BADGE_DICTIONARY } from '../constants/badges.js';

// GET /api/badges
router.get('/', (req, res) => {
  try {
    res.json(BADGE_DICTIONARY);
  } catch (err) {
    console.error('Error fetching badges:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

