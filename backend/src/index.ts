import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes';
import playerRoutes from './routes/playerRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import matchRoutes from './routes/matchRoutes';
import settingsRoutes from './routes/settingsRoutes';
import logger from './lib/logger';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { swaggerSpec } from './lib/swagger';
import prisma from './lib/prisma';
import { initSentry, Sentry } from './lib/sentry';

dotenv.config();

// Initialize Sentry for error tracking
initSentry();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Apply rate limiting
app.use('/api/auth', authLimiter); // Stricter limit for auth
app.use('/api', apiLimiter); // General limit for all API routes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/settings', settingsRoutes);

// WebSocket
io.on('connection', (socket) => {
  logger.debug('User connected', { socketId: socket.id });

  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
    logger.debug('User joined their room', { userId });
  });

  socket.on('disconnect', () => {
    logger.debug('User disconnected', { socketId: socket.id });
  });
});

// Export io for use in controllers
export { io };

// Health check with database status
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Sentry error handler (must be after routes)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.expressErrorHandler());
}

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

