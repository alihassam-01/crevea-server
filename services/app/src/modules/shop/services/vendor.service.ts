import {
  getMessageRepository,
  getOrderItemRepository,
  getOrderRepository,
  getProductRepository,
  getShopRepository,
  Message,
} from '../../../database';
import { AuthorizationError, NotFoundError, OrderStatus, paginatedResponse, successResponse } from '@crevea/shared';
import * as orderService from '../../order/services/order.service';
import { VENDOR_ORDER_TRANSITIONS } from '../vendor.constants';

export interface VendorOrderFilter {
  vendorId: string;
  page: number;
  limit: number;
  status?: string;
  search?: string;
  from?: Date;
  to?: Date;
}

const getVendorShopIds = async (vendorId: string): Promise<string[]> => {
  const shops = await getShopRepository().find({ where: { sellerId: vendorId } });
  return shops.map(shop => shop.id);
};

const assertVendorOwnsShop = async (vendorId: string, shopId: string): Promise<void> => {
  const shop = await getShopRepository().findOne({ where: { id: shopId, sellerId: vendorId } });
  if (!shop) throw new AuthorizationError('This shop does not belong to the vendor');
};

const getVendorOrder = async (vendorId: string, orderId: string) => {
  const shopIds = await getVendorShopIds(vendorId);
  const items = await getOrderItemRepository().find({ where: { orderId, shopId: { __in: shopIds } } });
  if (items.length === 0) throw new AuthorizationError('This order does not belong to the vendor');
  const order = await getOrderRepository().findOne({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order', orderId);
  return { order, items };
};

export const listOrders = async (filters: VendorOrderFilter) => {
  const shopIds = await getVendorShopIds(filters.vendorId);
  if (shopIds.length === 0) return paginatedResponse([], filters.page, filters.limit, 0);

  const itemWhere: Record<string, unknown> = { shopId: { __in: shopIds } };
  const items = await getOrderItemRepository().find({ where: itemWhere });
  const orderIds = [...new Set(items.map(item => item.orderId))];
  if (orderIds.length === 0) return paginatedResponse([], filters.page, filters.limit, 0);

  const where: Record<string, unknown> = { id: { __in: orderIds } };
  if (filters.status) where.status = filters.status;
  if (filters.search) where.orderNumber = { __contains: filters.search };
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { __gt: filters.from } : {}),
      ...(filters.to ? { __lt: filters.to } : {}),
    };
  }
  const [orders, total] = await getOrderRepository().findAndCount({
    where,
    order: { createdAt: 'DESC' },
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  });
  const mappedOrders = await Promise.all(
    orders.map(async order => orderService.findById(order.id))
  );
  return paginatedResponse(
    mappedOrders.filter((order): order is NonNullable<typeof order> => order !== null),
    filters.page,
    filters.limit,
    total
  );
};

export const getOrder = async (vendorId: string, orderId: string) => {
  const { order, items } = await getVendorOrder(vendorId, orderId);
  return successResponse({ order, items });
};

export const acceptOrder = async (vendorId: string, orderId: string) => {
  const { order } = await getVendorOrder(vendorId, orderId);
  if (order.status !== OrderStatus.PENDING) throw new Error('Only pending orders can be accepted');
  return successResponse(await orderService.updateStatus(orderId, OrderStatus.PROCESSING));
};

export const updateOrderStatus = async (vendorId: string, orderId: string, status: OrderStatus) => {
  const { order } = await getVendorOrder(vendorId, orderId);
  if (!VENDOR_ORDER_TRANSITIONS[order.status]?.includes(status)) {
    throw new Error(`Cannot transition from ${order.status} to ${status}`);
  }
  return successResponse(await orderService.updateStatus(orderId, status));
};

export const editOrder = async (vendorId: string, orderId: string, data: { trackingNumber?: string }) => {
  await getVendorOrder(vendorId, orderId);
  await getOrderRepository().update(orderId, data);
  const updated = await getOrderRepository().findOne({ where: { id: orderId } });
  return successResponse(updated);
};

export const createMessage = async (vendorId: string, orderId: string, body: string) => {
  const { order, items } = await getVendorOrder(vendorId, orderId);
  const message = getMessageRepository().create({
    senderId: vendorId,
    recipientId: order.customerId,
    orderId,
    shopId: items[0].shopId,
    body,
    read: false,
  });
  await getMessageRepository().save(message);
  return successResponse(message);
};

export const listMessages = async (vendorId: string, orderId: string, page: number, limit: number) => {
  await getVendorOrder(vendorId, orderId);
  const [messages, total] = await getMessageRepository().findAndCount({
    where: { orderId },
    order: { createdAt: 'ASC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return paginatedResponse(messages, page, limit, total);
};

export const assertShopOwnership = assertVendorOwnsShop;
