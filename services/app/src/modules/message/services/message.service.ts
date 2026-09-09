import {
  getMessageRepository,
  getOrderItemRepository,
  getOrderRepository,
  getShopRepository,
  getUserRepository,
  Message,
} from '../../../database';
import { AuthorizationError, NotFoundError, UserRole, paginatedResponse, successResponse } from '@crevea/shared';
import { NotificationType } from '@crevea/shared';
import * as notificationService from '../../notification/services/notification.service';
import { v4 as uuidv4 } from 'uuid';

const getOrderContext = async (userId: string, orderId: string) => {
  const order = await getOrderRepository().findOne({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order', orderId);

  const items = await getOrderItemRepository().find({ where: { orderId } });
  if (items.length === 0) throw new NotFoundError('Order items for order', orderId);
  const user = await getUserRepository().findOne({ where: { id: userId } });
  const shops = await getShopRepository().find({ where: items.map(item => ({ id: item.shopId })) });
  const vendorIds = [...new Set(shops.map(shop => shop.sellerId))];
  const isCustomer = order.customerId === userId;
  const isVendor = user?.role === UserRole.VENDOR && vendorIds.includes(userId);

  if (!isCustomer && !isVendor) throw new AuthorizationError('You are not a participant in this order');

  return {
    order,
    shopId: items[0]?.shopId,
    recipientId: isCustomer ? vendorIds[0] : order.customerId,
  };
};

export const listForUser = async (userId: string, page: number, limit: number) => {
  const [messages, total] = await getMessageRepository().findAndCount({
    where: [{ senderId: userId }, { recipientId: userId }],
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return paginatedResponse(messages, page, limit, total);
};

export const listForOrder = async (userId: string, orderId: string, page: number, limit: number) => {
  await getOrderContext(userId, orderId);
  const [messages, total] = await getMessageRepository().findAndCount({
    where: { orderId },
    order: { createdAt: 'ASC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return paginatedResponse(messages, page, limit, total);
};

export const send = async (userId: string, orderId: string, body: string) => {
  const context = await getOrderContext(userId, orderId);
  if (!context.recipientId) throw new AuthorizationError('This order has no message recipient');

  const message = getMessageRepository().create({
    id: uuidv4(),
    senderId: userId,
    recipientId: context.recipientId,
    orderId,
    shopId: context.shopId,
    body,
    read: false,
    createdAt: new Date(),
  }) as Message;
  await getMessageRepository().save(message);

  await notificationService.create({
    userId: context.recipientId,
    type: NotificationType.MESSAGE_RECEIVED,
    title: 'New message',
    message: 'You have a new message about an order.',
    data: { orderId },
  });

  return successResponse(message);
};
