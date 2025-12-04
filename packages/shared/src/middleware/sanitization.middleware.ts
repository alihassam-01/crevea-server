import { FastifyRequest, FastifyReply } from 'fastify';
import { sanitizeObject } from '../utils/sanitization';

/**
 * Middleware to sanitize request body
 * Applies to all string fields in the request body
 */
export const sanitizeBody = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (request.body && typeof request.body === 'object') {
    request.body = sanitizeObject(request.body as Record<string, any>);
  }
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQuery = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (request.query && typeof request.query === 'object') {
    request.query = sanitizeObject(request.query as Record<string, any>);
  }
};

/**
 * Middleware to sanitize both body and query
 */
export const sanitizeRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  await sanitizeBody(request, reply);
  await sanitizeQuery(request, reply);
};
