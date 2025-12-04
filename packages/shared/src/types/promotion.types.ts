/**
 * Promotion Type
 */
export enum PromotionType {
  DISCOUNT_CODE = 'DISCOUNT_CODE',
  FLASH_SALE = 'FLASH_SALE',
  FEATURED_PRODUCT = 'FEATURED_PRODUCT',
  LOYALTY_REWARD = 'LOYALTY_REWARD',
  REFERRAL = 'REFERRAL',
}

/**
 * Discount Type
 */
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

/**
 * Promotion Status
 */
export enum PromotionStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

/**
 * Discount Code
 */
export interface IDiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  applicableProducts?: string[];
  applicableShops?: string[];
  startDate: Date;
  endDate: Date;
  status: PromotionStatus;
  createdBy: string;
  createdAt: Date;
}

/**
 * Flash Sale
 */
export interface IFlashSale {
  id: string;
  name: string;
  description?: string;
  products: IFlashSaleProduct[];
  startDate: Date;
  endDate: Date;
  status: PromotionStatus;
  createdAt: Date;
}

export interface IFlashSaleProduct {
  productId: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  sold: number;
}

/**
 * Featured Product
 */
export interface IFeaturedProduct {
  id: string;
  productId: string;
  position: number;
  startDate: Date;
  endDate: Date;
  status: PromotionStatus;
  createdAt: Date;
}

/**
 * Loyalty Program
 */
export interface ILoyaltyProgram {
  id: string;
  userId: string;
  points: number;
  tier: LoyaltyTier;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

/**
 * Referral
 */
export interface IReferral {
  id: string;
  referrerId: string;
  refereeId: string;
  code: string;
  status: ReferralStatus;
  reward: number;
  createdAt: Date;
  completedAt?: Date;
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}
