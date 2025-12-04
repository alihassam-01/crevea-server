import { IEvent, EventType } from '@crevea/shared';
import { createLogger } from '@crevea/shared';
import * as notificationService from '../services/notification.service';

const logger = createLogger('event-handler');

export const handleAllEvents = async (event: IEvent): Promise<void> => {
  try {
    logger.info(`Handling event: ${event.type}`);

    const notificationMap: Record<string, { title: string; getMessage: (payload: any) => string }> = {
      [EventType.ORDER_CREATED]: {
        title: 'Order Created',
        getMessage: (p) => `Your order #${p.orderId} has been created successfully.`,
      },
      [EventType.ORDER_CONFIRMED]: {
        title: 'Order Confirmed',
        getMessage: (p) => `Your order has been confirmed and is being processed.`,
      },
      [EventType.ORDER_SHIPPED]: {
        title: 'Order Shipped',
        getMessage: (p) => `Your order has been shipped!`,
      },
      [EventType.ORDER_DELIVERED]: {
        title: 'Order Delivered',
        getMessage: (p) => `Your order has been delivered.`,
      },
      [EventType.PAYMENT_COMPLETED]: {
        title: 'Payment Successful',
        getMessage: (p) => `Payment of R${p.amount} completed successfully.`,
      },
      [EventType.SHOP_APPROVED]: {
        title: 'Shop Approved',
        getMessage: (p) => `Congratulations! Your shop has been approved.`,
      },
      [EventType.SHOP_REJECTED]: {
        title: 'Shop Rejected',
        getMessage: (p) => `Your shop verification was not approved.`,
      },
    };

    const config = notificationMap[event.type];
    if (!config) {
      logger.warn(`No notification config for event type: ${event.type}`);
      return;
    }

    // Determine user ID from payload
    const userId = event.payload.customerId || event.payload.userId || event.payload.sellerId;
    if (!userId) {
      logger.warn(`No user ID found in event payload for: ${event.type}`);
      return;
    }

    await notificationService.create({
      userId,
      type: event.type,
      title: config.title,
      message: config.getMessage(event.payload),
      data: event.payload,
    });

    logger.info(`Notification created for user: ${userId}`);
  } catch (error) {
    logger.error('Failed to handle event:', error);
  }
};
