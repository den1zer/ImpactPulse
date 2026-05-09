import express from 'express';
const router  = express.Router();
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';

import {
  createTask,
  getOpenTasks,
  getTaskById,
  joinTask,
  leaveTask,
  submitProof,
  reviewParticipant,
  addComment,
  deleteComment,
  likeComment,
  getMyTasks,
  closeTask,
  getAllTasksAdmin,
  updateTask,
  deleteTask,
  claimTask,
  abandonTask,
} from '../controllers/taskController.js';

// ── Public ──────────────────────────────────────────────────────────────────
// ── Public ──────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all open tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of open tasks
 */
router.get('/',             getOpenTasks);

/**
 * @swagger
 * /api/tasks/my:
 *   get:
 *     summary: Get tasks created by or joined by the current user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's tasks
 */
router.get('/my',           isAuthenticated, getMyTasks);

/**
 * @swagger
 * /api/tasks/admin/all:
 *   get:
 *     summary: Get all tasks (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tasks
 */
router.get('/admin/all',    [isAuthenticated, isAdmin], getAllTasksAdmin);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task data
 *       404:
 *         description: Task not found
 */
router.get('/:id',          getTaskById);

// ── Create (any authenticated user) ─────────────────────────────────────────
/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post(
  '/',
  [isAuthenticated, uploadMiddleware.single('taskFile')],
  createTask
);

// ── Participation ────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/tasks/{id}/join:
 *   post:
 *     summary: Join a task
 *     tags: [Tasks]
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
 *         description: Joined task successfully
 */
router.post('/:id/join',    isAuthenticated, joinTask);

/**
 * @swagger
 * /api/tasks/{id}/leave:
 *   post:
 *     summary: Leave a task
 *     tags: [Tasks]
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
 *         description: Left task successfully
 */
router.post('/:id/leave',   isAuthenticated, leaveTask);

// ── Proof submission ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/tasks/{id}/submit-proof:
 *   post:
 *     summary: Submit proof for a task
 *     tags: [Tasks]
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
 *         description: Proof submitted successfully
 */
router.post(
  '/:id/submit-proof',
  [isAuthenticated, uploadMiddleware.single('proofFile')],
  submitProof
);

// ── Creator review ───────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/tasks/{id}/review:
 *   post:
 *     summary: Review a participant's submission
 *     tags: [Tasks]
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
 *         description: Review submitted successfully
 */
router.post('/:id/review',  isAuthenticated, reviewParticipant);

/**
 * @swagger
 * /api/tasks/{id}/close:
 *   post:
 *     summary: Close a task
 *     tags: [Tasks]
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
 *         description: Task closed successfully
 */
router.post('/:id/close',   isAuthenticated, closeTask);

// ── Comments ─────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 */
router.post('/:id/comments',                    isAuthenticated, addComment);

/**
 * @swagger
 * /api/tasks/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 */
router.delete('/:id/comments/:commentId',        isAuthenticated, deleteComment);

/**
 * @swagger
 * /api/tasks/{id}/comments/{commentId}/like:
 *   post:
 *     summary: Like a comment
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment liked successfully
 */
router.post('/:id/comments/:commentId/like',     isAuthenticated, likeComment);

// ── Admin ────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/tasks/{id}/admin:
 *   put:
 *     summary: Update task (Admin only)
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
 *         description: Task updated successfully
 */
router.put('/:id/admin',    [isAuthenticated, isAdmin], updateTask);

/**
 * @swagger
 * /api/tasks/{id}/admin:
 *   delete:
 *     summary: Delete task (Admin only)
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
 *         description: Task deleted successfully
 */
router.delete('/:id/admin', [isAuthenticated, isAdmin], deleteTask);

// ── Legacy (backward compat) ─────────────────────────────────────────────────
router.put('/:id/claim',    isAuthenticated, claimTask);
router.put('/:id/abandon',  isAuthenticated, abandonTask);

export default router;

