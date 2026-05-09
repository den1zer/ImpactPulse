import Ticket from '../models/Ticket.js';
import Feedback from '../models/Feedback.js';

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