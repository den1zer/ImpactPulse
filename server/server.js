import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';

// Примусово змушуємо Node.js спочатку шукати IPv4 адреси (критично для Render)
dns.setDefaultResultOrder('ipv4first');

import authRoutes from './routes/auth.js';
import userRoutes from './routes/userRoutes.js';
import contributionRoutes from './routes/contributionRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import fundraiserRoutes from './routes/fundraiserRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import skinRoutes from './routes/skinRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';
import questRoutes from './routes/questRoutes.js';
import shopRoutes from './routes/shop.js';
import guildRoutes from './routes/guildRoutes.js';
import paymentRoutes from './routes/payment.js';
import dns from 'node:dns';
// Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

// Примусово змушуємо Node.js спочатку шукати IPv4 адреси
dns.setDefaultResultOrder('ipv4first');
// Load cron jobs
import './cron/resetWeekly.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
// 1. JSON parsing — must be first
app.use(express.json());

// 2. Request logger
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// 3. CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : true; // allow all in dev

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// 4. Static files
app.use('/uploads', express.static('uploads'));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- API ROUTES (must be BEFORE Swagger & static catch-all) ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/fundraisers', fundraiserRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/skins', skinRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/payment', paymentRoutes);

// --- SWAGGER (mounted AFTER API routes, only at /api-docs) ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});