import 'reflect-metadata';
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createLogger } from '@crevea/shared';
import { errorHandler, notFoundHandler } from '@crevea/shared';
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import { initDatabase } from './config/database';
import { initRedis } from './config/redis';
import { initKafka } from './config/kafka';



const logger = createLogger('auth-service');
const PORT = parseInt(process.env.PORT || '3001', 10);

/**
 * Build Fastify server
 */
const buildServer = async () => {
  const server = Fastify({
    logger: false, // Using custom Pino logger
    trustProxy: true,
  });

  // Register plugins
  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:9011',
    credentials: true,
  });

  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  // Health check
  server.get('/health', async () => {
    return { status: 'ok', service: 'auth', timestamp: new Date().toISOString() };
  });

  // Register routes
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(oauthRoutes, { prefix: '/api/oauth' });

  // Error handlers
  server.setErrorHandler(errorHandler);
  server.setNotFoundHandler(notFoundHandler);

  return server;
};

/**
 * Start server
 */
const start = async () => {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database connected');

    // Initialize Redis
    await initRedis();
    logger.info('Redis connected');

    // Initialize Kafka
    await initKafka();
    logger.info('Kafka connected');

    // Build and start server
    const server = await buildServer();
    await server.listen({ port: PORT, host: '0.0.0.0' });

    logger.info(`Auth service running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

start();
