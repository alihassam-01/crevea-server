import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { createLogger, errorHandler, notFoundHandler } from '@crevea/shared';
import productRoutes from './routes/product.routes';
import { initDatabase } from './config/database';
import { initRedis } from './config/redis';
import { initKafka } from './config/kafka';

dotenv.config();

const logger = createLogger('product-service');
const PORT = parseInt(process.env.PORT || '3003', 10);

const buildServer = async () => {
  const server = Fastify({ logger: false, trustProxy: true });

  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await server.register(helmet, { contentSecurityPolicy: false });

  server.get('/health', async () => ({
    status: 'ok',
    service: 'product',
    timestamp: new Date().toISOString(),
  }));

  await server.register(productRoutes, { prefix: '/products' });

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

    await initKafka();
    logger.info('Kafka connected');

    const server = await buildServer();
    await server.listen({ port: PORT, host: '0.0.0.0' });

    logger.info(`Product service running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
