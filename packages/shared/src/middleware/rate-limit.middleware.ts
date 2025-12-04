import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimitError } from '../errors';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Rate Limiting Middleware Factory
 */
export const rateLimit = (options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: FastifyRequest) => string;
}) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (request) => request.ip,
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = keyGenerator(request);
    const now = Date.now();

    // Clean up expired entries
    if (store[key] && store[key].resetTime < now) {
      delete store[key];
    }

    // Initialize or increment counter
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[key].count++;
    }

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      
      reply.header('Retry-After', retryAfter.toString());
      reply.header('X-RateLimit-Limit', maxRequests.toString());
      reply.header('X-RateLimit-Remaining', '0');
      reply.header('X-RateLimit-Reset', store[key].resetTime.toString());
      
      throw new RateLimitError();
    }

    // Set rate limit headers
    const remaining = maxRequests - store[key].count;
    reply.header('X-RateLimit-Limit', maxRequests.toString());
    reply.header('X-RateLimit-Remaining', remaining.toString());
    reply.header('X-RateLimit-Reset', store[key].resetTime.toString());
  };
};
