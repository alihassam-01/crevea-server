/**
 * Notification Type
 */
export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  SHOP_APPROVED = 'SHOP_APPROVED',
  SHOP_REJECTED = 'SHOP_REJECTED',
  PRODUCT_OUT_OF_STOCK = 'PRODUCT_OUT_OF_STOCK',
  NEW_REVIEW = 'NEW_REVIEW',
  REVIEW_RESPONSE = 'REVIEW_RESPONSE',
  PROMOTION_STARTED = 'PROMOTION_STARTED',
  PAYOUT_PROCESSED = 'PAYOUT_PROCESSED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

/**
 * Notification Channel
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

/**
 * Notification interface
 */
export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

/**
 * Notification Preferences
 */
export interface INotificationPreferences {
  userId: string;
  preferences: Record<NotificationType, NotificationChannel[]>;
  updatedAt: Date;
}

/**
 * Email Template
 */
export interface IEmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Email Queue
 */
export interface IEmailQueue {
  id: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  status: EmailStatus;
  attempts: number;
  maxAttempts: number;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}
