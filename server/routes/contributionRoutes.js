import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js'; 
import uploadMiddleware from '../middleware/uploadMiddleware.js';
import { 
  addContribution,
  getPendingContributions,
  approveContribution,
  rejectContribution,
  getMyContributions
} from '../controllers/contributionController.js';

/**
 * @swagger
 * /api/contributions/add:
 *   post:
 *     summary: Add a new contribution
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Contribution added successfully
 */
router.post(
  '/add', 
  [ 
    isAuthenticated, 
    uploadMiddleware.single('proofFile'),
    body('title', 'Заголовок є обов\'язковим').not().isEmpty(),
    body('type', 'Тип є обов\'язковим').isIn(['donation', 'volunteering', 'aid', 'other']),
    body('amount').if(body('type').equals('donation')).isNumeric().withMessage('Сума має бути числом'),
    body('itemList').if(body('type').equals('aid')).not().isEmpty().withMessage('Перелік є обов\'язковим'),
  ],
  validate,
  addContribution
);

/**
 * @swagger
 * /api/contributions/pending:
 *   get:
 *     summary: Get pending contributions (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending contributions
 */
router.get('/pending', [ isAuthenticated, isAdmin ], getPendingContributions);

/**
 * @swagger
 * /api/contributions/approve/{id}:
 *   put:
 *     summary: Approve a contribution (Admin only)
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
 *         description: Contribution approved
 */
router.put('/approve/:id', [ isAuthenticated, isAdmin ], approveContribution);

/**
 * @swagger
 * /api/contributions/reject/{id}:
 *   put:
 *     summary: Reject a contribution (Admin only)
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
 *         description: Contribution rejected
 */
router.put('/reject/:id', [ isAuthenticated, isAdmin ], rejectContribution);

/**
 * @swagger
 * /api/contributions/my:
 *   get:
 *     summary: Get current user's contributions
 *     tags: [Contributions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's contributions
 */
router.get('/my', isAuthenticated, getMyContributions);

export default router;