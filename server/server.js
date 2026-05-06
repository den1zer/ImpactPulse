const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : true; // allow all in dev

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
// Serve static files (avatars, proofs)
app.use('/uploads', express.static('uploads'));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- ROUTES (ПІДКЛЮЧЕННЯ ВСІХ РОУТІВ) ---
// Ось тут була проблема - деяких рядків не вистачало
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/userRoutes'));            // Фіксить /api/users/me 404
app.use('/api/contributions', require('./routes/contributionRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/fundraisers', require('./routes/fundraiserRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/skins', require('./routes/skinRoutes'));            // Фіксить /api/skins 404
app.use('/api/badges', require('./routes/badgeRoutes'));          // Роут для бейджів
app.use('/api/quests', require('./routes/questRoutes'));          // Роут для квестів
app.use('/api/shop', require('./routes/shop'));

// --- CRON JOBS ---
require('./cron/resetWeekly');

// Підключення ES-модуля payment.js через динамічний import, оскільки весь проект на CommonJS
import('./routes/payment.js')
  .then((paymentRouter) => {
    app.use('/api/payment', paymentRouter.default);
  })
  .catch(err => console.error('Помилка завантаження payment роута:', err));

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});