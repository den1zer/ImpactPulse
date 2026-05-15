import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import {
  createFundraiser,
  getAllFundraisers,
  getFundraiserById,
  simulateDonation,
  getAllFundraisersAdmin,
  updateFundraiser,
  deleteFundraiser
} from '../controllers/fundraiserController.js';

/**
 * @swagger
 * /api/fundraisers:
 *   post:
 *     summary: Create a fundraiser (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Fundraiser created successfully
 */
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

/**
 * @swagger
 * /api/fundraisers:
 *   get:
 *     summary: Get all active fundraisers
 *     tags: [Fundraisers]
 *     responses:
 *       200:
 *         description: List of fundraisers
 */
router.get('/', getAllFundraisers);

// ⚠️ Static routes MUST come before dynamic /:id routes
/**
 * @swagger
 * /api/fundraisers/admin/all:
 *   get:
 *     summary: Get all fundraisers (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all fundraisers
 */
router.get('/admin/all', [isAuthenticated, isAdmin], getAllFundraisersAdmin);

/**
 * @swagger
 * /api/fundraisers/{id}:
 *   get:
 *     summary: Get a single fundraiser by ID
 *     tags: [Fundraisers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fundraiser data
 *       404:
 *         description: Not found
 */
router.get('/:id', getFundraiserById);

/**
 * @swagger
 * /api/fundraisers/{id}/donate:
 *   post:
 *     summary: Simulate a donation
 *     tags: [Fundraisers]
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
 *         description: Donation processed
 */
router.post(
  '/:id/donate',
  [
    isAuthenticated,
    body('amount', 'Сума має бути додатнім числом').isFloat({ gt: 0 })
  ],
  validate,
  simulateDonation
);

/**
 * @swagger
 * /api/fundraisers/{id}/admin:
 *   put:
 *     summary: Update fundraiser (Admin only)
 *     tags: [Admin]
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
 *         description: Fundraiser updated
 */
router.put('/:id/admin', [isAuthenticated, isAdmin], updateFundraiser);

/**
 * @swagger
 * /api/fundraisers/{id}/admin:
 *   delete:
 *     summary: Delete fundraiser (Admin only)
 *     tags: [Admin]
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
 *         description: Fundraiser deleted
 */
router.delete('/:id/admin', [isAuthenticated, isAdmin], deleteFundraiser);

export default router;
