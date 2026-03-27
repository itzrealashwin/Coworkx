import 'dotenv/config';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { globalLimiter } from './middlewares/rateLimiter.middleware.js';
import errorHandler from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import orgRoutes from './routes/org.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import roleRoutes from './routes/role.routes.js';
import projectRoutes from './routes/project.routes.js';

const app = express();

// ─── Security headers ────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || 'http://localhost:5173',
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: true,   // reflect request origin
    credentials: true,
  })
);

// ─── Body parsers ────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Cookie parser ───────────────────────────────────────────
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── Global rate limiter ─────────────────────────────────────
app.use(globalLimiter);

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running.' });
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/orgs', roleRoutes);
app.use('/api/orgs', projectRoutes);
app.use('/api/invitations', invitationRoutes);

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// ─── Central error handler (MUST be last) ────────────────────
app.use(errorHandler);

// ─── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;

