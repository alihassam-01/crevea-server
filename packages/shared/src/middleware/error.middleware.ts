import { FastifyRequest, FastifyReply } from 'fastify';
import { BaseError } from '../errors';
import { errorResponse } from '../utils/response';
import logger from '../utils/logger';

/**
 * Global Error Handler
 */
export const errorHandler = async (
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log error
  logger.error({
    err: error,
    req: {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
    },
  });

  // Handle BaseError instances
  if (error instanceof BaseError) {
    return reply.status(error.statusCode).send(error.toJSON());
  }

  // Handle validation errors from Fastify
  if (error.name === 'ValidationError') {
    return reply.status(400).send(
      errorResponse('VALIDATION_ERROR', error.message)
    );
  }

  // Handle unknown errors
  return reply.status(500).send(
    errorResponse(
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message
    )
  );
};

/**
 * Not Found Handler
 */
export const notFoundHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  return reply.status(404).send(
    errorResponse(
      'NOT_FOUND',
      `Route ${request.method} ${request.url} not found`
    )
  );
};
