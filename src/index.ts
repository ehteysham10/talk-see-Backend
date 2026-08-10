import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { dbService } from './services/dbService.js';
import { logger } from './utils/logger.js';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

import { socketAuthMiddleware } from './sockets/socketMiddleware.js';
import { setupSocketHandlers } from './sockets/socketHandlers.js';

async function startServer() {
  await dbService.connect();
  logger.info(`Database connected. Server initialization started in ${env.NODE_ENV} mode.`);

  const app = express();
  const httpServer = createServer(app);

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, 'http://localhost:5173'],
      credentials: true,
    },
  });

  // Attach Socket Middleware & Handlers
  io.use(socketAuthMiddleware as any);
  setupSocketHandlers(io);

  // Global Middlewares
  app.use(helmet());
  app.use(cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173'],
    credentials: true,
  }));
  // Sanitize request data against NoSQL injection attacks
  app.use(mongoSanitize());
  // Global rate limit: 200 requests per 15 minutes per IP
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again after 15 minutes.' },
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/chats', chatRoutes);

  // Serve uploads folder statically
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  // Error Handling
  app.use(notFound);
  app.use(errorHandler);

  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

startServer().catch((err: unknown) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
