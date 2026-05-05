const express = require('express');
const router = express.Router();
const { BADGE_DICTIONARY } = require('../constants/badges');

// GET /api/badges
router.get('/', (req, res) => {
  try {
    res.json(BADGE_DICTIONARY);
  } catch (err) {
    console.error('Error fetching badges:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
