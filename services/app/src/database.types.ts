import {
  JsonObject,
  JsonValue,
  NotificationType,
  OAuthProvider,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  ProductType,
  ShopCategory,
  ShopStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@crevea/shared';

export type DecimalValue = number | { toString(): string };

export interface User {
  id: string; email: string; passwordHash: string; firstName: string; lastName: string;
  phone?: string; avatar?: string; role: UserRole; status: UserStatus;
  emailVerified: boolean; mfaEnabled: boolean; mfaSecret?: string;
  preferences?: JsonValue; createdAt: Date; updatedAt: Date; lastLoginAt?: Date;
}

export interface OAuthAccount {
  id: string; userId: string; provider: OAuthProvider; providerId: string;
  email?: string; profile?: JsonValue; createdAt: Date;
}

export interface Session {
  id: string; userId: string; refreshToken: string; expiresAt: Date;
  ipAddress?: string; userAgent?: string; createdAt: Date;
}

export interface Asset {
  id: string; environment: string; domain: string; entityId: string;
  assetType: string; assetId: string; variant: string; objectKey: string;
  contentHash: string; mimeType: string; size: number; uploadedBy: string;
  createdAt: Date; updatedAt: Date;
}

export interface Coupon {
  id: string; shopId: string; sellerId: string; code: string; discountType: string;
  discountValue: DecimalValue; minPurchaseAmount: DecimalValue; maxDiscountAmount?: DecimalValue;
  usageLimit?: number; usageCount: number; startsAt: Date; endsAt: Date; active: boolean;
  createdAt: Date; updatedAt: Date;
}

export interface VerificationToken {
  id: string; userId: string; token: string; expiresAt: Date; used: boolean; createdAt: Date;
}
export type PasswordResetToken = VerificationToken;
export type EmailVerificationToken = VerificationToken;

export interface Shop {
  id: string; slug: string; sellerId: string; name: string; description?: string;
  logo?: string; banner?: string; category: ShopCategory; status: ShopStatus;
  verificationStatus: VerificationStatus; address?: JsonValue; phone?: string; email?: string;
  socialLinks?: JsonValue; commissionRate: DecimalValue; deliveryFee: DecimalValue;
  salePercent: DecimalValue; saleStartsAt?: Date; saleEndsAt?: Date; rating: DecimalValue;
  totalReviews: number; totalSales: number; verificationDocuments?: JsonValue;
  createdAt: Date; updatedAt: Date;
}

export interface VendorStory {
  id: string; vendorId: string; title: string; body: string;
  coverImageUrl?: string; images: string[]; videoUrl?: string; published: boolean;
  publishedAt?: Date; createdAt: Date; updatedAt: Date;
}

export interface WishlistItem {
  id: string; userId: string; productId: string; createdAt: Date;
}

export interface SizeChart {
  id: string; shopId: string; name: string; imageUrl: string; category?: string;
  createdAt: Date; updatedAt: Date;
}

export interface SellerEarnings {
  id: string; shopId: string; orderId: string; grossAmount: DecimalValue;
  commissionRate: DecimalValue; commissionAmount: DecimalValue; netAmount: DecimalValue;
  status: string; createdAt: Date; updatedAt: Date;
}

export interface Payout {
  id: string; shopId: string; requestedAmount: DecimalValue; approvedAmount?: DecimalValue;
  status: string; paymentMethod: string; paymentDetails: JsonValue; requestedAt: Date;
  approvedAt?: Date; completedAt?: Date; approvedBy?: string; notes?: string;
  rejectionReason?: string; updatedAt: Date;
}

export interface Product {
  id: string; shopId: string; name: string; slug: string; description?: string;
  shortDescription?: string; type: ProductType; status: ProductStatus; category: string;
  tags: string[]; images: string[]; price: DecimalValue; compareAtPrice?: DecimalValue;
  salePercent: DecimalValue; saleStartsAt?: Date; saleEndsAt?: Date;
  currency: string; sku?: string; weight?: number; dimensions?: JsonValue; attributes?: JsonValue;
  rating: DecimalValue; totalReviews: number; totalSales: number; isFeatured: boolean;
  sizeChartId?: string; createdAt: Date; updatedAt: Date;
}

export interface Inventory {
  id: string; productId: string; variationId?: string; stock: number; reserved: number;
  available: number; lowStockThreshold: number; restockDate?: Date; updatedAt: Date;
}

export interface ProductVariation {
  id: string; productId: string; name: string; sku?: string; priceAdjustment: DecimalValue;
  stock: number; images: string[]; createdAt: Date;
}

export interface Order {
  id: string; orderNumber: string; customerId: string; subtotal: DecimalValue; tax: DecimalValue;
  shippingCost: DecimalValue; discount: DecimalValue; total: DecimalValue; status: OrderStatus;
  shippingAddress: JsonValue; trackingNumber?: string; metadata?: JsonValue;
  createdAt: Date; updatedAt: Date;
}

export interface OrderItem {
  id: string; orderId: string; productId: string; shopId: string; productName: string;
  productImage?: string; quantity: number; price: DecimalValue; total: DecimalValue;
  variation?: JsonValue; createdAt: Date;
}

export interface ReturnRequest {
  id: string; orderId: string; customerId: string; reason: string; status: string;
  images: string[]; createdAt: Date; updatedAt: Date;
}

export interface Payment {
  id: string; orderId: string; customerId: string; amount: DecimalValue; currency: string;
  method: PaymentMethod; status: PaymentStatus; gatewayTransactionId?: string;
  gatewayResponse?: JsonValue; failureReason?: string; metadata?: JsonValue;
  createdAt: Date; updatedAt: Date;
}

export interface Notification {
  id: string; userId: string; type: NotificationType; title: string; message: string;
  data?: JsonObject; read: boolean; createdAt: Date;
}

export interface Review {
  id: string; type: string; targetId: string; customerId: string; orderId?: string;
  rating: number; title?: string; comment?: string; images: string[]; status: string;
  helpfulCount: number; verifiedPurchase: boolean; sellerResponse?: JsonValue;
  createdAt: Date; updatedAt: Date;
}

export interface Message {
  id: string; senderId: string; recipientId: string; orderId?: string; shopId?: string;
  body: string; read: boolean; createdAt: Date;
}

export interface ContentPage {
  id: string; key: string; title: string; body: string; version: number;
  published: boolean; createdBy: string; createdAt: Date; updatedAt: Date;
}

export type { JsonValue };
