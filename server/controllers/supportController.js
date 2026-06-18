import Ticket from '../models/Ticket.js';
import Feedback from '../models/Feedback.js';
import SupportMessage from '../models/SupportMessage.js';

/**
 * Creates a new support ticket.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response confirming the creation.
 */
export const createTicket = async (req, res) => {
  try {
    const { name, phone, email, question } = req.body;
    
    const newTicket = new Ticket({
      name,
      phone,
      email,
      question,
      user: req.user ? req.user.id : null 
    });
    
    await newTicket.save();
    res.status(201).json({ msg: 'Тікет успішно створено! Адмін скоро з вами зв\'яжеться.' });
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Submits feedback from a user.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response confirming submission.
 */
export const createFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const newFeedback = new Feedback({
      rating,
      comment,
      user: req.user.id 
    });
    
    await newFeedback.save();
    res.status(201).json({ msg: 'Дякуємо за ваш відгук!' });
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Retrieves all open support tickets for administrative review.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of open tickets.
 */
export const getOpenTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ status: 'open' })
                                 .populate('user', 'username')
                                 .sort({ createdAt: 1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Retrieves all submitted feedback for administrative review.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of feedback entries.
 */
export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
                                   .populate('user', 'username email') 
                                   .sort({ createdAt: -1 }); 
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Retrieves support chat messages for the authenticated user.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of support messages.
 */
export const getChatMessages = async (req, res) => {
  try {
    const messages = await SupportMessage.find({ user: req.user.id })
                                         .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Sends a message in the support chat.
 * Administrators must specify the target user ID, while regular users message themselves (their own thread).
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with the sent message.
 */
export const sendChatMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const isAdmin = req.user.role === 'admin';
    
    const targetUserId = isAdmin ? req.body.userId : req.user.id;

    if (!targetUserId) return res.status(400).json({ msg: 'userId is required for admin' });

    const newMessage = new SupportMessage({
      user: targetUserId,
      sender: req.user.id,
      text,
      isAdmin
    });

    await newMessage.save();

    req.io.to(`user_${targetUserId}`).emit('support_message', newMessage);
    req.io.to('admins').emit('admin_new_support_message', newMessage);

    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Retrieves a list of all users who have interacted with support chat, 
 * aggregating their last message data.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of users and their latest support message.
 */
export const getAllChatUsers = async (req, res) => {
  try {
    const users = await SupportMessage.aggregate([
      {
        $group: {
          _id: '$user',
          lastMessage: { $last: '$text' },
          lastMessageAt: { $last: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          username: '$userInfo.username',
          email: '$userInfo.email',
          lastMessage: 1,
          lastMessageAt: 1
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);
    res.json(users);
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Retrieves the support chat messages for a specific user.
 * Intended for use by administrators.
 *
 * @param {import('express').Request} req - The Express request object containing the user ID.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of support messages.
 */
export const getAdminChatMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await SupportMessage.find({ user: userId })
                                         .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};