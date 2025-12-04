import { FastifyRequest, FastifyReply } from 'fastify';
import logger from '../utils/logger';

/**
 * Request Logging Middleware
 */
export const requestLogger = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const start = Date.now();

  reply.addHook('onSend', async () => {
    const duration = Date.now() - start;
    
    logger.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: request.user?.userId,
    });
  });
};
