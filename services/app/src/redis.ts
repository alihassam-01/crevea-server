import Redis from 'ioredis';
import { createLogger } from '@crevea/shared';

const logger = createLogger('redis');
let redis: Redis | undefined;

export async function initRedis(): Promise<void> {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (error) => logger.error('Redis error:', error));
  try {
    await redis.ping();
  } catch (error) {
    logger.error({ err: error }, 'Redis connection failed');
    throw error;
  }
}

export function getRedis(): Redis {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) await redis.quit();
}
