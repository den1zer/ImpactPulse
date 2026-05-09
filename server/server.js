import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

dotenv.config();

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

// --- ROUTES ---
// Using dynamic import for the newly converted auth route
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

// Other routes still use require via createRequire
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/contributions', require('./routes/contributionRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/fundraisers', require('./routes/fundraiserRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/skins', require('./routes/skinRoutes'));
app.use('/api/badges', require('./routes/badgeRoutes'));
app.use('/api/quests', require('./routes/questRoutes'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/guilds', require('./routes/guildRoutes'));

// --- CRON JOBS ---
require('./cron/resetWeekly');

// Dynamic import for payment router
import('./routes/payment.js')
  .then((paymentRouter) => {
    app.use('/api/payment', paymentRouter.default);
  })
  .catch(err => console.error('Помилка завантаження payment роута:', err));

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});