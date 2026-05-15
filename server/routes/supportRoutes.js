import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import { 
  createTicket, 
  createFeedback, 
  getOpenTickets,
  getAllFeedback,
  getChatMessages,
  sendChatMessage,
  getAllChatUsers,
  getAdminChatMessages
} from '../controllers/supportController.js';


/**
 * @swagger
 * /api/support/ticket:
 *   post:
 *     summary: Create a support ticket
 *     tags: [Support]
 *     responses:
 *       201:
 *         description: Ticket created successfully
 */
router.post(
  '/ticket', 
  [
    body('name', 'Ім\'я є обов\'язковим').not().isEmpty(),
    body('email', 'Введіть коректний email').isEmail(),
    body('question', 'Питання є обов\'язковим').not().isEmpty(),
  ],
  validate,
  createTicket
);

/**
 * @swagger
 * /api/support/feedback:
 *   post:
 *     summary: Create feedback
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Feedback created successfully
 */
router.post(
  '/feedback', 
  isAuthenticated,
  [
    body('rating', 'Рейтинг (1-5) є обов\'язковим').isInt({ min: 1, max: 5 }),
  ],
  validate,
  createFeedback
);

/**
 * @swagger
 * /api/support/tickets:
 *   get:
 *     summary: Get all open tickets (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of open tickets
 */
router.get('/tickets', [isAuthenticated, isAdmin], getOpenTickets);

/**
 * @swagger
 * /api/support/feedback:
 *   get:
 *     summary: Get all feedback (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all feedback
 */
router.get('/feedback', [isAuthenticated, isAdmin], getAllFeedback);

// Support Chat
router.get('/chat', isAuthenticated, getChatMessages);
router.post('/chat', isAuthenticated, sendChatMessage);

// Admin Chat Management
router.get('/chats', [isAuthenticated, isAdmin], getAllChatUsers);
router.get('/chat/:userId', [isAuthenticated, isAdmin], getAdminChatMessages);

export default router;