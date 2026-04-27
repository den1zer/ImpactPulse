const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware'); 
const {
  createTask,
  getOpenTasks,
  getTaskById,
  claimTask,
  abandonTask,
  getMyTasks,
  getAllTasksAdmin,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

router.post(
  '/', 
  [ 
    isAuthenticated, 
    isAdmin, 
    uploadMiddleware.single('taskFile'),
    body('title', 'Назва є обов\'язковою').not().isEmpty(),
    body('description', 'Опис є обов\'язковим').not().isEmpty(),
    body('category', 'Категорія є обов\'язковою').isIn(['volunteering', 'aid', 'other']),
    body('points', 'Бали мають бути числом').isInt({ gt: 0 }),
    body('endDate').optional().isISO8601().withMessage('Дата має бути у форматі YYYY-MM-DD'),
  ], 
  validate,
  createTask
);

router.get('/', getOpenTasks);
router.get('/my', isAuthenticated, getMyTasks);
router.get('/:id', getTaskById);
router.put('/:id/claim', isAuthenticated, claimTask);

router.put(
  '/:id/abandon',
  [
    isAuthenticated,
    body('reason', 'Причина є обов\'язковою').not().isEmpty()
  ],
  validate,
  abandonTask
);

router.get('/admin/all', [isAuthenticated, isAdmin], getAllTasksAdmin);
router.put('/:id/admin', [isAuthenticated, isAdmin], updateTask);
router.delete('/:id/admin', [isAuthenticated, isAdmin], deleteTask);

module.exports = router;
