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

  // Listen for when the response is finished being sent
  reply.raw.on('finish', () => {
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
