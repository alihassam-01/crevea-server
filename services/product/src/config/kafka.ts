import { Kafka, Producer, Consumer } from 'kafkajs';
import { createLogger, IEvent, EventType } from '@crevea/shared';

const logger = createLogger('kafka');
let kafka: Kafka;
let producer: Producer;
let consumer: Consumer;

export const initKafka = async (): Promise<void> => {
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'product-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: { initialRetryTime: 100, retries: 8 },
  });

  producer = kafka.producer();
  await producer.connect();
  logger.info('Kafka producer connected');

  consumer = kafka.consumer({ groupId: 'product-service-group' });
  await consumer.connect();
  logger.info('Kafka consumer connected');
};

export const publishEvent = async <T>(event: IEvent<T>): Promise<void> => {
  try {
    await producer.send({
      topic: 'crevea-events',
      messages: [{
        key: event.id,
        value: JSON.stringify(event),
        headers: { type: event.type },
      }],
    });
    logger.info(`Event published: ${event.type}`);
  } catch (error) {
    logger.error('Failed to publish event:', error);
    throw error;
  }
};

export const subscribeToEvents = async (
  eventTypes: EventType[],
  handler: (event: IEvent) => Promise<void>
): Promise<void> => {
  await consumer.subscribe({ topic: 'crevea-events', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value?.toString() || '{}') as IEvent;
        if (eventTypes.includes(event.type)) {
          await handler(event);
        }
      } catch (error) {
        logger.error('Failed to process event:', error);
      }
    },
  });
};

export const closeKafka = async (): Promise<void> => {
  if (producer) await producer.disconnect();
  if (consumer) await consumer.disconnect();
};

export { producer, consumer };
