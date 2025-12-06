import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { createLogger, errorHandler, notFoundHandler } from '@crevea/shared';
import promotionRoutes from './routes/promotion.routes';

dotenv.config();

const logger = createLogger('promotion-service');
const PORT = parseInt(process.env.PORT || '3010', 10);

const buildServer = async () => {
  const server = Fastify({ logger: false, trustProxy: true });

  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:9011',
    credentials: true,
  });

  await server.register(helmet, { contentSecurityPolicy: false });

  server.get('/health', async () => ({
    status: 'ok',
    service: 'promotion',
    timestamp: new Date().toISOString(),
  }));

  await server.register(promotionRoutes, { prefix: '/api/promotions' });

  server.setErrorHandler(errorHandler);
  server.setNotFoundHandler(notFoundHandler);

  return server;
};

const start = async () => {
  try {
    const server = await buildServer();
    await server.listen({ port: PORT, host: '0.0.0.0' });

    logger.info(`Promotion service running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
