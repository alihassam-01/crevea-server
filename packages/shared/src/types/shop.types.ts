/**
 * Shop Categories
 */
export enum ShopCategory {
  CROCHET = 'CROCHET',
  ART = 'ART',
  PAINTING = 'PAINTING',
  HANDCRAFT = 'HANDCRAFT',
}

/**
 * Shop Status
 */
export enum ShopStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

/**
 * Shop Verification Status
 */
export enum VerificationStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUIRES_RESUBMISSION = 'REQUIRES_RESUBMISSION',
}

/**
 * Shop interface
 */
export interface IShop {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  description: string;
  category: ShopCategory;
  logo?: string;
  banner?: string;
  status: ShopStatus;
  verificationStatus: VerificationStatus;
  verificationDocuments?: string[];
  verificationNotes?: string;
  commissionRate: number; // Platform commission (0-1)
  rating: number;
  totalReviews: number;
  totalSales: number;
  isOpen: boolean;
  address?: IAddress;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: ISocialLinks;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Address interface
 */
export interface IAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Social Links
 */
export interface ISocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
}

/**
 * Shop Analytics
 */
export interface IShopAnalytics {
  shopId: string;
  period: 'day' | 'week' | 'month' | 'year';
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: ITopProduct[];
  revenueByDay: IRevenueByDay[];
}

export interface ITopProduct {
  productId: string;
  productName: string;
  sales: number;
  revenue: number;
}

export interface IRevenueByDay {
  date: string;
  revenue: number;
  orders: number;
}
