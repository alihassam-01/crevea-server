import { IEvent, EventType } from '@crevea/shared';
import { createLogger, NotificationType } from '@crevea/shared';
import * as notificationService from '../services/notification.service';

const logger = createLogger('event-handler');

// Map EventType to NotificationType
const eventToNotificationTypeMap: Partial<Record<EventType, NotificationType>> = {
  [EventType.ORDER_CREATED]: NotificationType.ORDER_CREATED,
  [EventType.ORDER_CONFIRMED]: NotificationType.ORDER_CONFIRMED,
  [EventType.ORDER_SHIPPED]: NotificationType.ORDER_SHIPPED,
  [EventType.ORDER_DELIVERED]: NotificationType.ORDER_DELIVERED,
  [EventType.ORDER_CANCELLED]: NotificationType.ORDER_CANCELLED,
  [EventType.PAYMENT_COMPLETED]: NotificationType.PAYMENT_RECEIVED,
  [EventType.PAYMENT_FAILED]: NotificationType.PAYMENT_FAILED,
  [EventType.REFUND_COMPLETED]: NotificationType.REFUND_PROCESSED,
  [EventType.SHOP_APPROVED]: NotificationType.SHOP_APPROVED,
  [EventType.SHOP_REJECTED]: NotificationType.SHOP_REJECTED,
  [EventType.PRODUCT_OUT_OF_STOCK]: NotificationType.PRODUCT_OUT_OF_STOCK,
  [EventType.REVIEW_CREATED]: NotificationType.NEW_REVIEW,
  [EventType.PAYOUT_COMPLETED]: NotificationType.PAYOUT_PROCESSED,
};

export const handleAllEvents = async (event: IEvent): Promise<void> => {
  try {
    logger.info(`Handling event: ${event.type}`);

    const notificationMap: Partial<Record<EventType, { title: string; getMessage: (payload: any) => string }>> = {
      [EventType.ORDER_CREATED]: {
        title: 'Order Created',
        getMessage: (p) => `Your order #${p.orderId} has been created successfully.`,
      },
      [EventType.ORDER_CONFIRMED]: {
        title: 'Order Confirmed',
        getMessage: (_p) => `Your order has been confirmed and is being processed.`,
      },
      [EventType.ORDER_SHIPPED]: {
        title: 'Order Shipped',
        getMessage: (_p) => `Your order has been shipped!`,
      },
      [EventType.ORDER_DELIVERED]: {
        title: 'Order Delivered',
        getMessage: (_p) => `Your order has been delivered.`,
      },
      [EventType.PAYMENT_COMPLETED]: {
        title: 'Payment Successful',
        getMessage: (p) => `Payment of R${p.amount} completed successfully.`,
      },
      [EventType.SHOP_APPROVED]: {
        title: 'Shop Approved',
        getMessage: (_p) => `Congratulations! Your shop has been approved.`,
      },
      [EventType.SHOP_REJECTED]: {
        title: 'Shop Rejected',
        getMessage: (_p) => `Your shop verification was not approved.`,
      },
    };

    const config = notificationMap[event.type];
    if (!config) {
      logger.warn(`No notification config for event type: ${event.type}`);
      return;
    }

    // Get the corresponding NotificationType
    const notificationType = eventToNotificationTypeMap[event.type];
    if (!notificationType) {
      logger.warn(`No notification type mapping for event type: ${event.type}`);
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
      type: notificationType,
      title: config.title,
      message: config.getMessage(event.payload),
      data: event.payload,
    });

    logger.info(`Notification created for user: ${userId}`);
  } catch (error) {
    logger.error('Failed to handle event:', error);
  }
};
