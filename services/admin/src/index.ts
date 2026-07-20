import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createLogger, errorHandler, notFoundHandler } from '@crevea/shared';
import adminRoutes from './routes/admin.routes';
import payoutRoutes from './routes/payout.routes';
import { initRedis } from './config/redis';
import { getEventBus } from '@crevea/shared';



const logger = createLogger('admin-service');
const PORT = parseInt(process.env.PORT || '3009', 10);

const buildServer = async () => {
  const server = Fastify({ logger: false, trustProxy: true });

  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:9011',
    credentials: true,
  });

  await server.register(helmet, { contentSecurityPolicy: false });

  server.get('/health', async () => ({
    status: 'ok',
    service: 'admin',
    timestamp: new Date().toISOString(),
  }));

  await server.register(adminRoutes, { prefix: '/api/admin' });
  await server.register(payoutRoutes, { prefix: '/api/admin' });

  server.setErrorHandler(errorHandler);
  server.setNotFoundHandler(notFoundHandler);

  return server;
};

const start = async () => {
  try {
    await initRedis();
    logger.info('Redis connected');

    // Initialize Event Bus (Redis/Kafka)
    await getEventBus().connect();
    logger.info('Event Bus connected');

    const server = await buildServer();
    await server.listen({ port: PORT, host: '0.0.0.0' });

    logger.info(`Admin service running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
