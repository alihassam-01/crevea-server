import { IEventBus } from './interfaces';
import { RedisEventBus } from './redis-event-bus';

/**
 * Event Bus Factory
 */
export class EventBusFactory {
  private static instance: IEventBus;

  /**
   * Get Event Bus instance based on environment configuration
   */
  static getInstance(): IEventBus {
    if (!this.instance) {
      const type = process.env.EVENT_BUS_TYPE || 'redis';

      if (type === 'redis') {
        this.instance = new RedisEventBus();
      } else {
        // Fallback or Kafka (if we decide to add it later)
        throw new Error(`Unsupported Event Bus type: ${type}`);
      }
    }

    return this.instance;
  }
}

/**
 * Convenience functions for global access
 */
export const getEventBus = () => EventBusFactory.getInstance();
