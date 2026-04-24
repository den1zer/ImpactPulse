const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const {
  createFundraiser,
  getAllFundraisers,
  simulateDonation,
  getAllFundraisersAdmin,
  updateFundraiser,
  deleteFundraiser
} = require('../controllers/fundraiserController');

router.post(
  '/',
  [
    isAuthenticated,
    isAdmin,
    body('title', 'Назва є обов\'язковою').not().isEmpty(),
    body('description', 'Опис є обов\'язковим').not().isEmpty(),
    body('goalAmount', 'Ціль має бути додатнім числом').isInt({ gt: 0 }),
    body('cardNumber', 'Номер картки є обов\'язковим').isLength({ min: 16, max: 16 }),
  ],
  validate,
  createFundraiser
);

router.get('/', isAuthenticated, getAllFundraisers);

router.post(
  '/:id/donate',
  [
    isAuthenticated,
    body('amount', 'Сума має бути додатнім числом').isInt({ gt: 0 })
  ],
  validate,
  simulateDonation
);

router.get('/admin/all', [isAuthenticated, isAdmin], getAllFundraisersAdmin);
router.put('/:id/admin', [isAuthenticated, isAdmin], updateFundraiser);
router.delete('/:id/admin', [isAuthenticated, isAdmin], deleteFundraiser);

module.exports = router;
