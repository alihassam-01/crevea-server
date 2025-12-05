import 'reflect-metadata';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { createLogger, errorHandler, notFoundHandler } from '@crevea/shared';
import paymentRoutes from './routes/payment.routes';
import walletRoutes from './routes/wallet.routes';
import { initDatabase } from './config/database';
import { initRedis } from './config/redis';
import { initKafka, subscribeToEvents } from './config/kafka';
import { EventType } from '@crevea/shared';
import { handleOrderCreated } from './handlers/order.handler';

dotenv.config();

const logger = createLogger('payment-service');
const PORT = parseInt(process.env.PORT || '3005', 10);

const buildServer = async () => {
  const server = Fastify({ logger: false, trustProxy: true });

  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await server.register(helmet, { contentSecurityPolicy: false });

  server.get('/health', async () => ({
    status: 'ok',
    service: 'payment',
    timestamp: new Date().toISOString(),
  }));

  await server.register(paymentRoutes, { prefix: '/payments' });
  await server.register(walletRoutes, { prefix: '/wallet' });

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

    // Subscribe to order events
    await subscribeToEvents([EventType.ORDER_CREATED], handleOrderCreated);
    logger.info('Subscribed to order events');

    const server = await buildServer();
    await server.listen({ port: PORT, host: '0.0.0.0' });

    logger.info(`Payment service running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
