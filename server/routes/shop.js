const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { protect } = require('../middleware/auth');

router.get('/', protect, shopController.getAllItems);
router.post('/buy', protect, shopController.buyItem);

module.exports = router;
