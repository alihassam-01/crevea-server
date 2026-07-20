import { EventType, IEvent } from './types';

/**
 * Event Bus Interface
 */
export interface IEventBus {
  /**
   * Connect to the event bus
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the event bus
   */
  disconnect(): Promise<void>;

  /**
   * Publish an event
   */
  publish<T>(event: IEvent<T>): Promise<void>;

  /**
   * Subscribe to events
   */
  subscribe(
    eventTypes: EventType[],
    handler: (event: IEvent) => Promise<void>
  ): Promise<void>;
}
