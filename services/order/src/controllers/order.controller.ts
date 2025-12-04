import { successResponse, NotFoundError, AuthorizationError, paginatedResponse } from '@crevea/shared';
import { OrderStatus } from '@crevea/shared';
import * as orderService from '../services/order.service';
import * as cartService from '../services/cart.service';

export const createOrder = async (userId: string, data: any) => {
  // Get cart items
  const cart = await cartService.getCart(userId);
  
  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  // Create order
  const order = await orderService.create({
    customerId: userId,
    items: cart.items,
    shippingAddress: data.shippingAddress,
    billingAddress: data.billingAddress,
    paymentMethod: data.paymentMethod,
  });

  // Clear cart after order creation
  await cartService.clearCart(userId);

  return successResponse(order);
};

export const getOrder = async (id: string, userId: string) => {
  const order = await orderService.findById(id);
  
  if (!order) {
    throw new NotFoundError('Order', id);
  }

  // Verify ownership
  if (order.customerId !== userId) {
    throw new AuthorizationError('You can only view your own orders');
  }

  return successResponse(order);
};

export const getUserOrders = async (userId: string, options: { page: number; limit: number }) => {
  const { orders, total } = await orderService.findByCustomer(userId, options);
  return paginatedResponse(orders, options.page, options.limit, total);
};

export const updateOrderStatus = async (id: string, status: string, userId: string) => {
  const order = await orderService.findById(id);
  
  if (!order) {
    throw new NotFoundError('Order', id);
  }

  // Only allow certain status transitions
  const allowedTransitions: Record<string, string[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PACKED],
    [OrderStatus.PACKED]: [OrderStatus.SHIPPED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
  };

  if (!allowedTransitions[order.status]?.includes(status as OrderStatus)) {
    throw new Error(`Cannot transition from ${order.status} to ${status}`);
  }

  const updated = await orderService.updateStatus(id, status as OrderStatus);
  return successResponse(updated);
};

export const cancelOrder = async (id: string, userId: string, reason: string) => {
  const order = await orderService.findById(id);
  
  if (!order) {
    throw new NotFoundError('Order', id);
  }

  if (order.customerId !== userId) {
    throw new AuthorizationError();
  }

  // Only allow cancellation for certain statuses
  const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.PROCESSING];
  if (!cancellableStatuses.includes(order.status)) {
    throw new Error('Order cannot be cancelled at this stage');
  }

  const updated = await orderService.updateStatus(id, OrderStatus.CANCELLED);
  return successResponse(updated);
};

export const getOrderTracking = async (id: string, userId: string) => {
  const order = await orderService.findById(id);
  
  if (!order) {
    throw new NotFoundError('Order', id);
  }

  if (order.customerId !== userId) {
    throw new AuthorizationError();
  }

  // Return tracking information
  return successResponse({
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber,
    courierService: order.courierService,
    estimatedDelivery: order.estimatedDelivery,
    deliveredAt: order.deliveredAt,
  });
};
