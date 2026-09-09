import { getOrderRepository, getOrderItemRepository, getShopRepository, Order } from '../../../database';
import { OrderStatus, IOrder, getEventBus, PaymentMethod } from '@crevea/shared';
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
  paymentMethod: PaymentMethod;
}

const getVendorIdsForItems = async (items: Array<{ shopId: string }>): Promise<string[]> => {
  const shops = await getShopRepository().find({ where: items.map(item => ({ id: item.shopId })) });
  return [...new Set(shops.map(shop => shop.sellerId))];
};

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
    metadata: { paymentMethod: data.paymentMethod },
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
  const vendorIds = await getVendorIdsForItems(data.items);

  // Publish event
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.ORDER_CREATED,
    timestamp: new Date(),
    payload: {
      orderId: order.id,
      customerId: data.customerId,
      total: data.total,
      paymentMethod: data.paymentMethod,
      vendorIds,
      items: data.items.map(item => ({
        productId: item.productId,
        shopId: item.shopId,
        quantity: item.quantity,
        price: item.price,
      })),
    },
  };
  await getEventBus().publish(event);

  return mapOrderToInterface(order, orderItems);
};

export const findById = async (id: string): Promise<IOrder | null> => {
  const orderRepo = getOrderRepository();
  const orderItemRepo = getOrderItemRepository();
  
  const order = await orderRepo.findOne({ where: { id } });
  if (!order) return null;
  
  // Load order items
  const items = await orderItemRepo.find({ where: { orderId: id } });
  
  return mapOrderToInterface(order, items);
};

export const attachPaymentProof = async (id: string, assetId: string): Promise<IOrder | null> => {
  const orderRepo = getOrderRepository();
  const order = await orderRepo.findOne({ where: { id } });
  if (!order) return null;
  const metadata = (order.metadata && typeof order.metadata === 'object' && !Array.isArray(order.metadata))
    ? order.metadata as Record<string, unknown>
    : {};
  await orderRepo.update(id, {
    metadata: { ...metadata, paymentProofAssetId: assetId },
    updatedAt: new Date(),
  });
  return findById(id);
};

export const findByCustomer = async (
  customerId: string,
  options: { page: number; limit: number }
): Promise<{ orders: IOrder[]; total: number }> => {
  const orderRepo = getOrderRepository();
  const orderItemRepo = getOrderItemRepository();
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [orders, total] = await orderRepo.findAndCount({
    where: { customerId },
    order: { createdAt: 'DESC' },
    take: limit,
    skip,
  });

  // Load items for all orders
  const orderIds = orders.map(o => o.id);
  const allItems = orderIds.length > 0 
    ? await orderItemRepo.find({ 
        where: orderIds.map(id => ({ orderId: id }))
      })
    : [];

  // Group items by orderId
  const itemsByOrderId = new Map<string, any[]>();
  allItems.forEach(item => {
    if (!itemsByOrderId.has(item.orderId)) {
      itemsByOrderId.set(item.orderId, []);
    }
    itemsByOrderId.get(item.orderId)!.push(item);
  });

  return {
    orders: orders.map(order => mapOrderToInterface(order, itemsByOrderId.get(order.id) || [])),
    total,
  };
};

export const updateStatus = async (id: string, status: OrderStatus): Promise<IOrder> => {
  const orderRepo = getOrderRepository();
  const orderItemRepo = getOrderItemRepository();

  await orderRepo.update(id, { status });

  const order = await orderRepo.findOne({ where: { id } });
  if (!order) throw new Error('Order not found');

  // Load order items
  const items = await orderItemRepo.find({ where: { orderId: id } });
  const vendorIds = await getVendorIdsForItems(items);

  // Publish event
  const eventTypeByStatus: Partial<Record<OrderStatus, EventType>> = {
    [OrderStatus.PROCESSING]: EventType.ORDER_CONFIRMED,
    [OrderStatus.CONFIRMED]: EventType.ORDER_CONFIRMED,
    [OrderStatus.PACKED]: EventType.ORDER_PACKED,
    [OrderStatus.SHIPPED]: EventType.ORDER_SHIPPED,
    [OrderStatus.DELIVERED]: EventType.ORDER_DELIVERED,
    [OrderStatus.COMPLETED]: EventType.ORDER_COMPLETED,
    [OrderStatus.CANCELLED]: EventType.ORDER_CANCELLED,
  };
  const eventType = eventTypeByStatus[status];

  if (!eventType) return mapOrderToInterface(order, items);

  const event: IEvent = {
    id: uuidv4(),
    type: eventType,
    timestamp: new Date(),
  payload: { orderId: id, status, customerId: order.customerId, vendorIds },
  };
  await getEventBus().publish(event);

  return mapOrderToInterface(order, items);
};

export const cancelOrder = async (id: string): Promise<IOrder> => {
  return updateStatus(id, OrderStatus.CANCELLED);
};

const mapOrderToInterface = (order: Order, items: any[] = []): IOrder => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    items: items.map(item => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      shopId: item.shopId,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      price: parseFloat(item.price.toString()),
      subtotal: parseFloat(item.total.toString()),
      attributes: item.variation,
    })),
    subtotal: parseFloat(order.subtotal.toString()),
    tax: parseFloat(order.tax.toString()),
    shippingCost: parseFloat(order.shippingCost.toString()),
    discount: parseFloat(order.discount.toString()),
    total: parseFloat(order.total.toString()),
    status: order.status,
    shippingAddress: order.shippingAddress as any,
    trackingNumber: order.trackingNumber,
    currency: 'USD',
    paymentMethod: (order.metadata as any)?.paymentMethod || 'CARD',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};
