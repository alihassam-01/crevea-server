import { IEvent, IOrderCreatedPayload, JsonObject } from '@crevea/shared';
import { createLogger } from '@crevea/shared';
import * as paymentService from '../services/payment.service';
import { PaymentMethod } from '@crevea/shared';

const logger = createLogger('order-handler');

export const handleOrderCreated = async (event: IEvent<IOrderCreatedPayload>): Promise<void> => {
  try {
    logger.info(`Handling order created event: ${event.payload.orderId}`);

    // Create payment record
    await paymentService.create({
      orderId: event.payload.orderId,
      customerId: event.payload.customerId,
      amount: event.payload.total,
      method: PaymentMethod.CARD, // Default, will be updated
    });

    logger.info(`Payment record created for order: ${event.payload.orderId}`);
  } catch (error) {
    logger.error('Failed to handle order created event:', error);
  }
};

export const toOrderCreatedEvent = (event: IEvent): IEvent<IOrderCreatedPayload> | null => {
  const payload = event.payload;
  if (typeof payload.orderId !== 'string'
    || typeof payload.customerId !== 'string'
    || typeof payload.total !== 'number'
    || !Array.isArray(payload.items)) return null;

  const items = payload.items.filter((item): item is JsonObject => typeof item === 'object' && item !== null)
    .filter((item) => typeof item.productId === 'string' && typeof item.shopId === 'string' && typeof item.quantity === 'number' && typeof item.price === 'number')
    .map((item) => ({
      productId: String(item.productId),
      shopId: String(item.shopId),
      quantity: Number(item.quantity),
      price: Number(item.price),
    }));

  return {
    ...event,
    payload: { orderId: payload.orderId, customerId: payload.customerId, total: payload.total, items },
  };
};
