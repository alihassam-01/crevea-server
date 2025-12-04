import Redis from 'ioredis';
import { createLogger } from '@crevea/shared';

const logger = createLogger('redis');

let redis: Redis;

/**
 * Initialize Redis connection
 */
export const initRedis = async (): Promise<void> => {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('error', (error) => {
    logger.error('Redis error:', error);
  });

  // Test connection
  try {
    await redis.ping();
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

/**
 * Get Redis client
 */
export const getRedis = (): Redis => {
  if (!redis) {
    throw new Error('Redis not initialized');
  }
  return redis;
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    logger.info('Redis connection closed');
  }
};
