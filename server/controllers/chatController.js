import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

/**
 * Retrieves all conversations for the authenticated user along with their last messages.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of conversations with the most recent message attached.
 */
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    }).populate('participants', 'username avatarUrl role');

    const conversationsWithMessages = await Promise.all(
        conversations.map(async (conv) => {
            const lastMessage = await Message.findOne({ conversationId: conv._id }).sort('-createdAt');
            return {
                ...conv.toObject(),
                lastMessage
            };
        })
    );

    res.json(conversationsWithMessages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations' });
  }
};

/**
 * Retrieves all messages for a specific conversation.
 * Verifies that the user is a participant before returning data.
 *
 * @param {import('express').Request} req - The Express request object containing the conversation ID.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of messages.
 */
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const messages = await Message.find({ conversationId }).sort('createdAt').populate('sender', 'username avatarUrl role');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

/**
 * Sends a message to another user.
 * If no conversation exists, creates a new one (status 'pending' or 'accepted' if friends).
 *
 * @param {import('express').Request} req - The Express request object containing receiver ID and text.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with the conversation and new message details.
 */
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;

    if (receiverId.toString() === senderId.toString()) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);
      if (!receiver) return res.status(404).json({ message: 'Receiver not found' });
      
      const isFriend = sender.friends && sender.friends.includes(receiverId);

      // Бізнес-логіка: якщо користувачі не є друзями, новий чат отримує статус 'pending' (потребує прийняття).
      conversation = new Conversation({
        participants: [senderId, receiverId],
        initiator: senderId,
        status: isFriend ? 'accepted' : 'pending'
      });
      await conversation.save();
    }

    // Бізнес-логіка: якщо користувач відповідає на повідомлення в 'pending' чаті, він автоматично приймає бесіду.
    if (conversation.status === 'pending' && conversation.initiator.toString() !== senderId.toString()) {
      conversation.status = 'accepted';
      await conversation.save();
    }

    const message = new Message({
      conversationId: conversation._id,
      sender: senderId,
      text
    });
    await message.save();

    const populatedMessage = await message.populate('sender', 'username avatarUrl role');

    req.io.to(`user_${receiverId}`).emit('new_message', {
      conversation,
      message: populatedMessage
    });

    res.status(201).json({ conversation, message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

/**
 * Accepts a pending conversation request from another user.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with the updated conversation.
 */
export const acceptConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.participants.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not allowed' });
    }

    if (conversation.initiator.toString() === req.user.id.toString()) {
        return res.status(400).json({ message: 'Initiator cannot accept' });
    }

    conversation.status = 'accepted';
    await conversation.save();

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Error accepting conversation' });
  }
};

/**
 * Deletes a conversation and all its associated messages for all participants.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response confirming deletion.
 */
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (!conversation.participants.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not allowed' });
    }

    await Message.deleteMany({ conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting conversation' });
  }
};
