/**
 * Order Status
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  CONFIRMED = 'CONFIRMED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/**
 * Order interface
 */
export interface IOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  currency: string;
  shippingAddress: IShippingAddress;
  billingAddress?: IShippingAddress;
  paymentMethod: string;
  paymentId?: string;
  notes?: string;
  trackingNumber?: string;
  courierService?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order Item
 */
export interface IOrderItem {
  id: string;
  orderId: string;
  productId: string;
  shopId: string;
  variationId?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
  attributes?: Record<string, any>;
}

/**
 * Shipping Address
 */
export interface IShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

/**
 * Shopping Cart
 */
export interface ICart {
  userId: string;
  items: ICartItem[];
  subtotal: number;
  updatedAt: Date;
}

/**
 * Cart Item
 */
export interface ICartItem {
  productId: string;
  variationId?: string;
  quantity: number;
  price: number;
  shopId: string;
}

/**
 * Return Request
 */
export interface IReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  items: IReturnItem[];
  reason: string;
  description?: string;
  status: ReturnStatus;
  refundAmount: number;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IReturnItem {
  orderItemId: string;
  quantity: number;
}

export enum ReturnStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RECEIVED = 'RECEIVED',
  REFUNDED = 'REFUNDED',
}

/**
 * Order Tracking
 */
export interface IOrderTracking {
  orderId: string;
  events: ITrackingEvent[];
}

export interface ITrackingEvent {
  status: OrderStatus;
  description: string;
  location?: string;
  timestamp: Date;
}
