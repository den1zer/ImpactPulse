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

router.get('/pending', [ isAuthenticated, isAdmin ], getPendingContributions);
router.put('/approve/:id', [ isAuthenticated, isAdmin ], approveContribution);
router.put('/reject/:id', [ isAuthenticated, isAdmin ], rejectContribution);
router.get('/my', isAuthenticated, getMyContributions);

export default router;