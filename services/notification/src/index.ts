import 'reflect-metadata';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import { createLogger, errorHandler, notFoundHandler } from '@crevea/shared';
import notificationRoutes from './routes/notification.routes';
import { initDatabase } from './config/database';
import { initRedis } from './config/redis';
import { initKafka, subscribeToEvents } from './config/kafka';
import { EventType } from '@crevea/shared';
import { handleAllEvents } from './handlers/event.handler';

dotenv.config();

const logger = createLogger('notification-service');
const PORT = parseInt(process.env.PORT || '3006', 10);

const buildServer = async () => {
  const server = Fastify({ logger: false, trustProxy: true });

  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await server.register(helmet, { contentSecurityPolicy: false });
  await server.register(websocket);

  server.get('/health', async () => ({
    status: 'ok',
    service: 'notification',
    timestamp: new Date().toISOString(),
  }));

  await server.register(notificationRoutes, { prefix: '/notifications' });

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

    // Subscribe to all events for notifications
    await subscribeToEvents([
      EventType.ORDER_CREATED,
      EventType.ORDER_CONFIRMED,
      EventType.ORDER_SHIPPED,
      EventType.ORDER_DELIVERED,
      EventType.PAYMENT_COMPLETED,
      EventType.SHOP_APPROVED,
      EventType.SHOP_REJECTED,
    ], handleAllEvents);
    logger.info('Subscribed to notification events');

    const server = await buildServer();
    await server.listen({ port: PORT, host: '0.0.0.0' });

    logger.info(`Notification service running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
