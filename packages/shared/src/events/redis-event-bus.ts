import Redis from 'ioredis';
import { IEventBus } from './interfaces';
import { EventType, IEvent } from './types';
import { createLogger } from '../utils/logger';

const logger = createLogger('redis-event-bus');

/**
 * Redis implementation of the Event Bus
 */
export class RedisEventBus implements IEventBus {
  private publisher: Redis;
  private subscriber: Redis;
  private readonly channel = 'crevea-events';

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);

    this.publisher.on('error', (err) => logger.error('Redis Publisher Error', err));
    this.subscriber.on('error', (err) => logger.error('Redis Subscriber Error', err));
  }

  async connect(): Promise<void> {
    // In ioredis, connection is automatic, but we can ping to verify
    await Promise.all([
      this.publisher.ping(),
      this.subscriber.ping()
    ]);
    logger.info('Redis Event Bus connected');
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit()
    ]);
    logger.info('Redis Event Bus disconnected');
  }

  async publish<T>(event: IEvent<T>): Promise<void> {
    try {
      await this.publisher.publish(this.channel, JSON.stringify(event));
      logger.info(`Event published: ${event.type}`);
    } catch (error) {
      logger.error('Failed to publish event:', error);
      throw error;
    }
  }

  async subscribe(
    eventTypes: EventType[],
    handler: (event: IEvent) => Promise<void>
  ): Promise<void> {
    await this.subscriber.subscribe(this.channel);

    this.subscriber.on('message', async (channel, message) => {
      if (channel !== this.channel) return;

      try {
        const event = JSON.parse(message) as IEvent;
        if (eventTypes.includes(event.type)) {
          await handler(event);
        }
      } catch (error) {
        logger.error('Failed to process event:', error);
      }
    });

    logger.info(`Subscribed to events: ${eventTypes.join(', ')}`);
  }
}
