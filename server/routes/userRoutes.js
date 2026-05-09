import express from 'express';
const router = express.Router();
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js'; 
import {
  getUserProfile,
  getAllUsers,
  updateUserRole,
  updateUserProfile,
  getLeaderboard,
  updateSelectedBadge,
  getUserStats,
  updateAvatar,
  getPublicProfile,
  searchUsers,
  getFriends,
  addFriend,
  removeFriend
} from '../controllers/userController.js';

import multer from 'multer';
const uploadMemory = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
router.get('/me', isAuthenticated, getUserProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  '/me',
  [ 
    isAuthenticated, 
    uploadMemory.single('avatar'),
    body('username', 'Username є обов\'язковим').not().isEmpty(),
    body('age').optional({ checkFalsy: true }).isInt({ min: 13 }).withMessage('Вік має бути 13+'),
    body('backupEmail').optional({ checkFalsy: true }).isEmail().withMessage('Резервний email некоректний'),
    body('city').optional().isString(),
    body('gender').optional().isIn(['male', 'female', 'other', 'unspecified']),
  ],
  validate,
  updateUserProfile
);

/**
 * @swagger
 * /api/users/avatar:
 *   patch:
 *     summary: Update user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 */
router.patch('/avatar', isAuthenticated, uploadMemory.single('avatar'), updateAvatar);

/**
 * @swagger
 * /api/users/leaderboard:
 *   get:
 *     summary: Get user leaderboard
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Leaderboard data
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @swagger
 * /api/users/selected-badge:
 *   put:
 *     summary: Update selected badge
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Badge updated successfully
 */
router.put('/selected-badge', isAuthenticated, updateSelectedBadge);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/', [isAuthenticated, isAdmin], getAllUsers);

/**
 * @swagger
 * /api/users/role/{id}:
 *   put:
 *     summary: Update user role (Admin only)
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
 *         description: Role updated successfully
 */
router.put('/role/:id', [isAuthenticated, isAdmin], updateUserRole);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get('/stats', [isAuthenticated, isAdmin], getUserStats);

// Public profile and friends
/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', isAuthenticated, searchUsers);

/**
 * @swagger
 * /api/users/friends:
 *   get:
 *     summary: Get friends list
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Friends list
 */
router.get('/friends', isAuthenticated, getFriends);

/**
 * @swagger
 * /api/users/friends/add/{id}:
 *   post:
 *     summary: Add a friend
 *     tags: [Users]
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
 *         description: Friend added successfully
 */
router.post('/friends/add/:id', isAuthenticated, addFriend);

/**
 * @swagger
 * /api/users/friends/remove/{id}:
 *   post:
 *     summary: Remove a friend
 *     tags: [Users]
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
 *         description: Friend removed successfully
 */
router.post('/friends/remove/:id', isAuthenticated, removeFriend);

/**
 * @swagger
 * /api/users/profile/{id}:
 *   get:
 *     summary: Get public profile
 *     tags: [Users]
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
 *         description: Public profile data
 */
router.get('/profile/:id', isAuthenticated, getPublicProfile);

export default router;

