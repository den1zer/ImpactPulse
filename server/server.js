const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
// "Чотко" роздаємо статику (аватарки, пруфи)
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

// Підключення ES-модуля payment.js та wheel.js через динамічний import, оскільки весь проект на CommonJS
Promise.all([
  import('./routes/payment.js'),
  import('./routes/wheel.js')
])
  .then(([paymentRouter, wheelRouter]) => {
    app.use('/api/payment', paymentRouter.default);
    app.use('/api/wheel', wheelRouter.default);
  })
  .catch(err => console.error('Помилка завантаження ES-модулів:', err));

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});