import express from 'express';
import { getConversations, getMessages, sendMessage, acceptConversation, deleteConversation } from '../controllers/chatController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', isAuthenticated, getConversations);
router.get('/:conversationId/messages', isAuthenticated, getMessages);
router.post('/message', isAuthenticated, sendMessage);
router.put('/:conversationId/accept', isAuthenticated, acceptConversation);
router.delete('/:conversationId', isAuthenticated, deleteConversation);

export default router;
