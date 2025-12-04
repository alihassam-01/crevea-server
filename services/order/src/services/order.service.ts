import { getPool } from '../config/database';
import { publishEvent } from '../config/kafka';
import { IOrder, OrderStatus, IOrderCreatedPayload } from '@crevea/shared';
import { EventType, IEvent } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';

interface CreateOrderData {
  customerId: string;
  items: any[];
  shippingAddress: any;
  billingAddress?: any;
  paymentMethod: string;
}

export const create = async (data: CreateOrderData): Promise<IOrder> => {
  const pool = getPool();
  
  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15; // 15% tax
  const shippingCost = 50; // Flat rate for now
  const total = subtotal + tax + shippingCost;

  const result = await pool.query(
    `INSERT INTO orders (
      order_number, customer_id, status, subtotal, tax, shipping_cost, total,
      shipping_address, billing_address, payment_method
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      orderNumber,
      data.customerId,
      OrderStatus.PENDING,
      subtotal,
      tax,
      shippingCost,
      total,
      JSON.stringify(data.shippingAddress),
      data.billingAddress ? JSON.stringify(data.billingAddress) : null,
      data.paymentMethod,
    ]
  );

  const order = mapOrder(result.rows[0]);

  // Insert order items
  for (const item of data.items) {
    await pool.query(
      `INSERT INTO order_items (
        order_id, product_id, shop_id, variation_id, product_name,
        product_image, quantity, price, subtotal, attributes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        order.id,
        item.productId,
        item.shopId,
        item.variationId || null,
        item.productName,
        item.productImage || null,
        item.quantity,
        item.price,
        item.price * item.quantity,
        item.attributes ? JSON.stringify(item.attributes) : null,
      ]
    );
  }

  // Publish event
  const event: IEvent<IOrderCreatedPayload> = {
    id: uuidv4(),
    type: EventType.ORDER_CREATED,
    timestamp: new Date(),
    payload: {
      orderId: order.id,
      customerId: order.customerId,
      total: order.total,
      items: data.items.map(item => ({
        productId: item.productId,
        shopId: item.shopId,
        quantity: item.quantity,
        price: item.price,
      })),
    },
  };
  await publishEvent(event);

  return order;
};

export const findById = async (id: string): Promise<IOrder | null> => {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  
  if (result.rows.length === 0) return null;

  const order = mapOrder(result.rows[0]);
  
  // Get order items
  const itemsResult = await pool.query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [id]
  );
  order.items = itemsResult.rows.map(mapOrderItem);

  return order;
};

export const updateStatus = async (id: string, status: OrderStatus): Promise<IOrder> => {
  const pool = getPool();
  
  const result = await pool.query(
    'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, id]
  );

  const order = mapOrder(result.rows[0]);

  // Publish status change event
  const eventType = getEventTypeForStatus(status);
  if (eventType) {
    const event: IEvent = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date(),
      payload: { orderId: id, status },
    };
    await publishEvent(event);
  }

  return order;
};

export const findByCustomer = async (customerId: string, options: { page: number; limit: number }) => {
  const pool = getPool();
  const { page, limit } = options;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [customerId, limit, offset]
  );

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM orders WHERE customer_id = $1',
    [customerId]
  );

  return {
    orders: result.rows.map(mapOrder),
    total: parseInt(countResult.rows[0].count),
  };
};

const mapOrder = (row: any): IOrder => {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    status: row.status,
    items: [],
    subtotal: parseFloat(row.subtotal),
    tax: parseFloat(row.tax || 0),
    shippingCost: parseFloat(row.shipping_cost || 0),
    discount: parseFloat(row.discount || 0),
    total: parseFloat(row.total),
    currency: row.currency,
    shippingAddress: typeof row.shipping_address === 'string' 
      ? JSON.parse(row.shipping_address) 
      : row.shipping_address,
    billingAddress: row.billing_address 
      ? (typeof row.billing_address === 'string' ? JSON.parse(row.billing_address) : row.billing_address)
      : undefined,
    paymentMethod: row.payment_method,
    paymentId: row.payment_id,
    notes: row.notes,
    trackingNumber: row.tracking_number,
    courierService: row.courier_service,
    estimatedDelivery: row.estimated_delivery,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapOrderItem = (row: any) => {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    shopId: row.shop_id,
    variationId: row.variation_id,
    productName: row.product_name,
    productImage: row.product_image,
    quantity: row.quantity,
    price: parseFloat(row.price),
    subtotal: parseFloat(row.subtotal),
    attributes: row.attributes ? (typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes) : undefined,
  };
};

const getEventTypeForStatus = (status: OrderStatus): EventType | null => {
  const mapping: Record<string, EventType> = {
    [OrderStatus.CONFIRMED]: EventType.ORDER_CONFIRMED,
    [OrderStatus.SHIPPED]: EventType.ORDER_SHIPPED,
    [OrderStatus.DELIVERED]: EventType.ORDER_DELIVERED,
    [OrderStatus.COMPLETED]: EventType.ORDER_COMPLETED,
    [OrderStatus.CANCELLED]: EventType.ORDER_CANCELLED,
  };
  return mapping[status] || null;
};
