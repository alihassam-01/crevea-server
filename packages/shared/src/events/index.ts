/**
 * Kafka Event Types
 */
export enum EventType {
  // User Events
  USER_REGISTERED = 'user.registered',
  USER_VERIFIED = 'user.verified',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  
  // Shop Events
  SHOP_CREATED = 'shop.created',
  SHOP_UPDATED = 'shop.updated',
  SHOP_VERIFIED = 'shop.verified',
  SHOP_APPROVED = 'shop.approved',
  SHOP_REJECTED = 'shop.rejected',
  SHOP_DELETED = 'shop.deleted',
  
  // Product Events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_OUT_OF_STOCK = 'product.out_of_stock',
  PRODUCT_RESTOCKED = 'product.restocked',
  
  // Order Events
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_PACKED = 'order.packed',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_COMPLETED = 'order.completed',
  ORDER_CANCELLED = 'order.cancelled',
  
  // Payment Events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  REFUND_INITIATED = 'refund.initiated',
  REFUND_COMPLETED = 'refund.completed',
  PAYOUT_SCHEDULED = 'payout.scheduled',
  PAYOUT_COMPLETED = 'payout.completed',
  
  // Review Events
  REVIEW_CREATED = 'review.created',
  REVIEW_UPDATED = 'review.updated',
  REVIEW_DELETED = 'review.deleted',
  REVIEW_APPROVED = 'review.approved',
  REVIEW_REJECTED = 'review.rejected',
  
  // Notification Events
  NOTIFICATION_SEND = 'notification.send',
  EMAIL_SEND = 'email.send',
  SMS_SEND = 'sms.send',
  PUSH_SEND = 'push.send',
}

/**
 * Base Event Interface
 */
export interface IEvent<T = any> {
  id: string;
  type: EventType;
  timestamp: Date;
  payload: T;
  metadata?: {
    userId?: string;
    correlationId?: string;
    source?: string;
  };
}

/**
 * Event Payload Types
 */
export interface IUserRegisteredPayload {
  userId: string;
  email: string;
  role: string;
}

export interface IShopCreatedPayload {
  shopId: string;
  sellerId: string;
  name: string;
  category: string;
}

export interface IProductCreatedPayload {
  productId: string;
  shopId: string;
  name: string;
  price: number;
}

export interface IOrderCreatedPayload {
  orderId: string;
  customerId: string;
  total: number;
  items: Array<{
    productId: string;
    shopId: string;
    quantity: number;
    price: number;
  }>;
}

export interface IPaymentCompletedPayload {
  paymentId: string;
  orderId: string;
  amount: number;
  method: string;
}

export interface INotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  channels: string[];
  data?: Record<string, any>;
}
