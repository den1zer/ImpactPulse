const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, shopController.getAllItems);
router.post('/buy', isAuthenticated, shopController.buyItem);

module.exports = router;
