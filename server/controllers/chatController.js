import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    }).populate('participants', 'username avatarUrl role');

    // Also get the last message for each conversation
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

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Check if user is participant
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

      conversation = new Conversation({
        participants: [senderId, receiverId],
        initiator: senderId,
        status: isFriend ? 'accepted' : 'pending'
      });
      await conversation.save();
    }

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
