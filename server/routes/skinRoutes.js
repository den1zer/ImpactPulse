import express from 'express';
const router = express.Router();
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { getAllSkins } from '../controllers/skinController.js';

router.get('/', isAuthenticated, getAllSkins);

export default router;