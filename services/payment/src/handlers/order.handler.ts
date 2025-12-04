import { IEvent, IOrderCreatedPayload } from '@crevea/shared';
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
