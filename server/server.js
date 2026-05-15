// ── LEVEL 1: Global IPv4-first DNS — MUST be the very first lines executed ──
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
// ────────────────────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

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
import activityRoutes from './routes/activityRoutes.js';

// Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
// Load cron jobs
import './cron/resetWeekly.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
// 1. JSON + URL-encoded parsing — must be first
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // needed for LiqPay callback (form-encoded)

// 2. Request logger
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// 3. CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin header, e.g. LiqPay callbacks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development (no FRONTEND_URL set), allow all
    if (!process.env.FRONTEND_URL) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`), false);
  },
  credentials: true,
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- STATIC FILES ---
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
app.use('/api/activities', activityRoutes);

// --- SWAGGER (mounted AFTER API routes, only at /api-docs) ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('join_support', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined support chat`);
  });

  socket.on('join_admins', () => {
    socket.join('admins');
    console.log('Admin joined admins room');
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// --- START SERVER ---
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});