import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { createLogger, errorHandler, notFoundHandler } from '@crevea/shared';
import { initKafka, subscribeToEvents } from './config/kafka';
import { EventType } from '@crevea/shared';
import { handleEmailEvents } from './handlers/email.handler';

dotenv.config();

const logger = createLogger('email-service');
const PORT = parseInt(process.env.PORT || '3007', 10);

const buildServer = async () => {
  const server = Fastify({ logger: false, trustProxy: true });

  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  await server.register(helmet, { contentSecurityPolicy: false });

  server.get('/health', async () => ({
    status: 'ok',
    service: 'email',
    timestamp: new Date().toISOString(),
  }));

  server.setErrorHandler(errorHandler);
  server.setNotFoundHandler(notFoundHandler);

  return server;
};

const start = async () => {
  try {
    await initKafka();
    logger.info('Kafka connected');

    // Subscribe to email events
    await subscribeToEvents([EventType.EMAIL_SEND], handleEmailEvents);
    logger.info('Subscribed to email events');

    const server = await buildServer();
    await server.listen({ port: PORT, host: '0.0.0.0' });

    logger.info(`Email service running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
