import { IEvent, EventType } from '@crevea/shared';
import { createLogger, NotificationType } from '@crevea/shared';
import * as notificationService from '../services/notification.service';
import { JsonObject } from '@crevea/shared';
import { NotificationEventPayload } from '../types';

const logger = createLogger('event-handler');

// Map EventType to NotificationType
const eventToNotificationTypeMap: Partial<Record<EventType, NotificationType>> = {
  [EventType.ORDER_CREATED]: NotificationType.ORDER_CREATED,
  [EventType.ORDER_CONFIRMED]: NotificationType.ORDER_CONFIRMED,
  [EventType.ORDER_PACKED]: NotificationType.ORDER_PACKED,
  [EventType.ORDER_SHIPPED]: NotificationType.ORDER_SHIPPED,
  [EventType.ORDER_DELIVERED]: NotificationType.ORDER_DELIVERED,
  [EventType.ORDER_COMPLETED]: NotificationType.ORDER_COMPLETED,
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

    const notificationMap: Partial<Record<EventType, { title: string; getMessage: (payload: NotificationEventPayload) => string }>> = {
      [EventType.ORDER_CREATED]: {
        title: 'Order Created',
        getMessage: (p) => `Your order #${p.orderId} has been created successfully.`,
      },
      [EventType.ORDER_CONFIRMED]: {
        title: 'Order Confirmed',
        getMessage: (_p) => `Your order has been confirmed and is being processed.`,
      },
      [EventType.ORDER_PACKED]: {
        title: 'Order Packed',
        getMessage: (_p) => `Your order has been packed and is preparing to ship.`,
      },
      [EventType.ORDER_SHIPPED]: {
        title: 'Order Shipped',
        getMessage: (_p) => `Your order has been shipped!`,
      },
      [EventType.ORDER_DELIVERED]: {
        title: 'Order Delivered',
        getMessage: (_p) => `Your order has been delivered.`,
      },
      [EventType.ORDER_COMPLETED]: {
        title: 'Order Completed',
        getMessage: (_p) => `Your order has been completed.`,
      },
      [EventType.ORDER_CANCELLED]: {
        title: 'Order Cancelled',
        getMessage: (_p) => `Your order has been cancelled.`,
      },
      [EventType.PAYMENT_COMPLETED]: {
        title: 'Payment Successful',
        getMessage: (p) => `Payment of R${String(p.amount)} completed successfully.`,
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
    const payload = event.payload as JsonObject & NotificationEventPayload;
    const userIds = [...new Set([
      payload.customerId,
      payload.userId,
      payload.sellerId,
      ...(payload.vendorIds || []),
    ].filter((userId): userId is string => typeof userId === 'string'))];
    if (userIds.length === 0) {
      logger.warn(`No user ID found in event payload for: ${event.type}`);
      return;
    }

    await Promise.all(userIds.map((userId) => notificationService.create({
      userId,
      type: notificationType,
      title: config.title,
      message: config.getMessage(payload),
      data: payload,
    })));

    logger.info(`Notifications created for users: ${userIds.join(', ')}`);
  } catch (error) {
    logger.error('Failed to handle event:', error);
  }
};
