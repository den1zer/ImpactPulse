import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import {
  createFundraiser,
  getAllFundraisers,
  simulateDonation,
  getAllFundraisersAdmin,
  updateFundraiser,
  deleteFundraiser
} from '../controllers/fundraiserController.js';

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

router.get('/', getAllFundraisers);

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

export default router;
