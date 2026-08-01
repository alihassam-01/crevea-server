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

/**
 * Size Chart interface
 */
export interface ISizeChart {
  id: string;
  shopId: string;
  name: string;
  imageUrl: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Seller Earnings interface
 */
export interface ISellerEarnings {
  id: string;
  shopId: string;
  orderId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payout interface
 */
export interface IShopPayout {
  id: string;
  shopId: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  requestedAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  approvedBy?: string;
  paymentMethod: string;
  paymentDetails: import('./json.types').JsonObject;
  notes?: string;
  rejectionReason?: string;
  updatedAt: Date;
}

/**
 * Seller Balance interface
 */
export interface ISellerBalance {
  totalEarnings: number;
  totalCommission: number;
  netEarnings: number;
  pendingBalance: number;
  payoutsCompleted: number;
  payoutsPending: number;
}


