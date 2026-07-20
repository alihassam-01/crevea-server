import 'reflect-metadata';
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createLogger, errorHandler, notFoundHandler } from '@crevea/shared';
import shopRoutes from './routes/shop.routes';
import sizeChartRoutes from './routes/size-chart.routes';
import sellerRoutes from './routes/seller.routes';
import adminShopRoutes from './routes/admin-shop.routes';
import { initDatabase } from './config/database';
import { initRedis } from './config/redis';
import { getEventBus } from '@crevea/shared';

const logger = createLogger('shop-service');
const PORT = parseInt(process.env.PORT || '3002', 10);

const buildServer = async () => {
  const server = Fastify({
    logger: false,
    trustProxy: true,
  });

  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:9011',
    credentials: true,
  });

  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  server.get('/health', async () => {
    return { status: 'ok', service: 'shop', timestamp: new Date().toISOString() };
  });

  await server.register(shopRoutes, { prefix: '/api/shops' });
  await server.register(sizeChartRoutes, { prefix: '/api/shops' });
  await server.register(sellerRoutes, { prefix: '/api/shops' });
  await server.register(adminShopRoutes, { prefix: '/api/admin' });
  server.setErrorHandler(errorHandler);
  server.setNotFoundHandler(notFoundHandler);

  return server;
};

const start = async () => {
  try {
    await initDatabase();
    logger.info('Database connected');

    await initRedis();
    logger.info('Redis connected');

    // Initialize Event Bus (Redis/Kafka)
    await getEventBus().connect();
    logger.info('Event Bus connected');

    const server = await buildServer();
    await server.listen({ port: PORT, host: '0.0.0.0' });

    logger.info(`Shop service running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

start();
