import { paginatedResponse } from '@crevea/shared';
import * as notificationService from '../services/notification.service';

export const getNotifications = async (
  userId: string,
  options: { page: number; limit: number; unreadOnly?: boolean }
) => {
  const { notifications, total } = await notificationService.findByUserId(userId, options);
  return paginatedResponse(notifications, options.page, options.limit, total);
};

export const markAsRead = async (id: string, userId: string) => {
  await notificationService.markAsRead(id, userId);
};

export const markAllAsRead = async (userId: string) => {
  await notificationService.markAllAsRead(userId);
};
