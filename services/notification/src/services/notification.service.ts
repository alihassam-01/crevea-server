import { getNotificationRepository } from '../config/database';
import { Notification } from '../config/database';
import { INotification, NotificationType } from '@crevea/shared';
import { publishEvent } from '../config/kafka';
import { EventType, IEvent } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export const create = async (data: CreateNotificationData): Promise<INotification> => {
  const notificationRepo = getNotificationRepository();

  const notification = notificationRepo.create({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data,
    read: false,
  });

  await notificationRepo.save(notification);

  // Publish email event if needed
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.EMAIL_SEND,
    timestamp: new Date(),
    payload: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      channels: ['EMAIL'],
      data: data.data,
    },
  };
  await publishEvent(event);

  return mapNotificationToInterface(notification);
};

export const findByUserId = async (
  userId: string,
  options: { page: number; limit: number; unreadOnly?: boolean }
): Promise<{ notifications: INotification[]; total: number }> => {
  const notificationRepo = getNotificationRepository();
  const { page, limit, unreadOnly } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (unreadOnly) {
    where.read = false;
  }

  const [notifications, total] = await notificationRepo.findAndCount({
    where,
    order: { createdAt: 'DESC' },
    take: limit,
    skip,
  });

  return {
    notifications: notifications.map(mapNotificationToInterface),
    total,
  };
};

export const markAsRead = async (id: string, userId: string): Promise<void> => {
  const notificationRepo = getNotificationRepository();
  await notificationRepo.update({ id, userId }, { read: true });
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  const notificationRepo = getNotificationRepository();
  await notificationRepo.update({ userId, read: false }, { read: true });
};

const mapNotificationToInterface = (notification: Notification): INotification => {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type as NotificationType,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    channels: ['IN_APP' as any], // Default to in-app notifications
    isRead: notification.read,
    createdAt: notification.createdAt,
  };
};
