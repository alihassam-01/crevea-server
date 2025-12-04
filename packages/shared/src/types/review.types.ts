/**
 * Review Type
 */
export enum ReviewType {
  PRODUCT = 'PRODUCT',
  SHOP = 'SHOP',
}

/**
 * Review Status
 */
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Review interface
 */
export interface IReview {
  id: string;
  type: ReviewType;
  targetId: string; // productId or shopId
  customerId: string;
  orderId?: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  images?: string[];
  status: ReviewStatus;
  helpfulCount: number;
  verifiedPurchase: boolean;
  sellerResponse?: ISellerResponse;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Seller Response to Review
 */
export interface ISellerResponse {
  sellerId: string;
  comment: string;
  createdAt: Date;
}

/**
 * Review Helpful Vote
 */
export interface IReviewHelpful {
  reviewId: string;
  userId: string;
  createdAt: Date;
}

/**
 * Review Analytics
 */
export interface IReviewAnalytics {
  targetId: string;
  type: ReviewType;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: IRatingDistribution;
}

export interface IRatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}
