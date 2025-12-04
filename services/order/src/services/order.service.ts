import { getOrderRepository, getOrderItemRepository, Order } from '../config/database';
import { OrderStatus, IOrder } from '@crevea/shared';
import { publishEvent } from '../config/kafka';
import { EventType, IEvent } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';

interface CreateOrderData {
  customerId: string;
  items: Array<{
    productId: string;
    shopId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
    variation?: any;
  }>;
  shippingAddress: any;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
}

export const createOrder = async (data: CreateOrderData): Promise<IOrder> => {
  const orderRepo = getOrderRepository();
  const orderItemRepo = getOrderItemRepository();

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create order
  const order = orderRepo.create({
    orderNumber,
    customerId: data.customerId,
    subtotal: data.subtotal,
    tax: data.tax,
    shippingCost: data.shippingCost,
    discount: data.discount,
    total: data.total,
    status: OrderStatus.PENDING,
    shippingAddress: data.shippingAddress,
  });

  await orderRepo.save(order);

  // Create order items
  const orderItems = data.items.map(item =>
    orderItemRepo.create({
      orderId: order.id,
      productId: item.productId,
      shopId: item.shopId,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      variation: item.variation,
    })
  );

  await orderItemRepo.save(orderItems);

  // Publish event
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.ORDER_CREATED,
    timestamp: new Date(),
    payload: {
      orderId: order.id,
      customerId: data.customerId,
      total: data.total,
    },
  };
  await publishEvent(event);

  return mapOrderToInterface(order);
};

export const findById = async (id: string): Promise<IOrder | null> => {
  const orderRepo = getOrderRepository();
  const order = await orderRepo.findOne({ where: { id } });
  return order ? mapOrderToInterface(order) : null;
};

export const findByCustomer = async (
  customerId: string,
  options: { page: number; limit: number }
): Promise<{ orders: IOrder[]; total: number }> => {
  const orderRepo = getOrderRepository();
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [orders, total] = await orderRepo.findAndCount({
    where: { customerId },
    order: { createdAt: 'DESC' },
    take: limit,
    skip,
  });

  return {
    orders: orders.map(mapOrderToInterface),
    total,
  };
};

export const updateStatus = async (id: string, status: OrderStatus): Promise<IOrder> => {
  const orderRepo = getOrderRepository();

  await orderRepo.update(id, { status });

  const order = await orderRepo.findOne({ where: { id } });
  if (!order) throw new Error('Order not found');

  // Publish event
  const eventType = status === OrderStatus.CONFIRMED
    ? EventType.ORDER_CONFIRMED
    : status === OrderStatus.SHIPPED
    ? EventType.ORDER_SHIPPED
    : status === OrderStatus.DELIVERED
    ? EventType.ORDER_DELIVERED
    : EventType.ORDER_CANCELLED;

  const event: IEvent = {
    id: uuidv4(),
    type: eventType,
    timestamp: new Date(),
    payload: { orderId: id, status },
  };
  await publishEvent(event);

  return mapOrderToInterface(order);
};

export const cancelOrder = async (id: string): Promise<IOrder> => {
  return updateStatus(id, OrderStatus.CANCELLED);
};

const mapOrderToInterface = (order: Order): IOrder => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    items: [], // Items would be loaded separately
    subtotal: parseFloat(order.subtotal.toString()),
    tax: parseFloat(order.tax.toString()),
    shippingCost: parseFloat(order.shippingCost.toString()),
    discount: parseFloat(order.discount.toString()),
    total: parseFloat(order.total.toString()),
    status: order.status,
    shippingAddress: order.shippingAddress as any,
    trackingNumber: order.trackingNumber,
    currency: 'USD',
    paymentMethod: 'card',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};
