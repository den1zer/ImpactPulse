import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import { 
  createTicket, 
  createFeedback, 
  getOpenTickets,
  getAllFeedback
} from '../controllers/supportController.js';

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

router.post(
  '/feedback', 
  isAuthenticated,
  [
    body('rating', 'Рейтинг (1-5) є обов\'язковим').isInt({ min: 1, max: 5 }),
  ],
  validate,
  createFeedback
);

router.get('/tickets', [isAuthenticated, isAdmin], getOpenTickets);
router.get('/feedback', [isAuthenticated, isAdmin], getAllFeedback);

export default router;