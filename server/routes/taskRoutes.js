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
router.get('/',             getOpenTasks);
router.get('/my',           isAuthenticated, getMyTasks);
router.get('/admin/all',    [isAuthenticated, isAdmin], getAllTasksAdmin);
router.get('/:id',          getTaskById);

// ── Create (any authenticated user) ─────────────────────────────────────────
router.post(
  '/',
  [isAuthenticated, uploadMiddleware.single('taskFile')],
  createTask
);

// ── Participation ────────────────────────────────────────────────────────────
router.post('/:id/join',    isAuthenticated, joinTask);
router.post('/:id/leave',   isAuthenticated, leaveTask);

// ── Proof submission ─────────────────────────────────────────────────────────
router.post(
  '/:id/submit-proof',
  [isAuthenticated, uploadMiddleware.single('proofFile')],
  submitProof
);

// ── Creator review ───────────────────────────────────────────────────────────
router.post('/:id/review',  isAuthenticated, reviewParticipant);
router.post('/:id/close',   isAuthenticated, closeTask);

// ── Comments ─────────────────────────────────────────────────────────────────
router.post('/:id/comments',                    isAuthenticated, addComment);
router.delete('/:id/comments/:commentId',        isAuthenticated, deleteComment);
router.post('/:id/comments/:commentId/like',     isAuthenticated, likeComment);

// ── Admin ────────────────────────────────────────────────────────────────────
router.put('/:id/admin',    [isAuthenticated, isAdmin], updateTask);
router.delete('/:id/admin', [isAuthenticated, isAdmin], deleteTask);

// ── Legacy (backward compat) ─────────────────────────────────────────────────
router.put('/:id/claim',    isAuthenticated, claimTask);
router.put('/:id/abandon',  isAuthenticated, abandonTask);

export default router;

