const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware'); 
const {
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
} = require('../controllers/userController');

const multer = require('multer');
const uploadMemory = multer({ storage: multer.memoryStorage() });

router.get('/me', isAuthenticated, getUserProfile);

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

router.patch('/avatar', isAuthenticated, uploadMemory.single('avatar'), updateAvatar);


router.get('/leaderboard', getLeaderboard);
router.put('/selected-badge', isAuthenticated, updateSelectedBadge);
router.get('/', [isAuthenticated, isAdmin], getAllUsers);
router.put('/role/:id', [isAuthenticated, isAdmin], updateUserRole);
router.get('/stats', [isAuthenticated, isAdmin], getUserStats);

// Public profile and friends
router.get('/search', isAuthenticated, searchUsers);
router.get('/friends', isAuthenticated, getFriends);
router.post('/friends/add/:id', isAuthenticated, addFriend);
router.post('/friends/remove/:id', isAuthenticated, removeFriend);
router.get('/profile/:id', isAuthenticated, getPublicProfile);

module.exports = router;
