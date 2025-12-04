import { getReviewRepository } from '../config/database';
import { Review } from '@crevea/shared';
import { ReviewType, ReviewStatus, IReview } from '@crevea/shared';
import { publishEvent } from '../config/kafka';
import { EventType, IEvent } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml, sanitizeText, isValidImageUrl } from '@crevea/shared';

interface CreateReviewData {
  type: ReviewType;
  targetId: string;
  customerId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export const create = async (data: CreateReviewData): Promise<IReview> => {
  const reviewRepo = getReviewRepository();

  // Additional validation and sanitization
  const sanitizedTitle = data.title ? sanitizeText(data.title) : undefined;
  const sanitizedComment = data.comment ? sanitizeHtml(data.comment) : undefined;
  
  // Validate image URLs
  const validImages = data.images?.filter(url => isValidImageUrl(url)) || [];

  // Create review (entity will auto-sanitize on save)
  const review = reviewRepo.create({
    type: data.type,
    targetId: data.targetId,
    customerId: data.customerId,
    orderId: data.orderId,
    rating: Math.max(1, Math.min(5, data.rating)), // Ensure 1-5 range
    title: sanitizedTitle,
    comment: sanitizedComment,
    images: validImages,
    status: ReviewStatus.PENDING,
    verifiedPurchase: !!data.orderId,
    helpfulCount: 0,
  });

  await reviewRepo.save(review);

  // Publish event
  const event: IEvent = {
    id: uuidv4(),
    type: EventType.REVIEW_CREATED,
    timestamp: new Date(),
    payload: {
      reviewId: review.id,
      targetId: data.targetId,
      rating: data.rating,
    },
  };
  await publishEvent(event);

  return mapReviewToInterface(review);
};

export const findByTarget = async (
  targetId: string,
  options: { page: number; limit: number }
): Promise<{ reviews: IReview[]; total: number }> => {
  const reviewRepo = getReviewRepository();
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [reviews, total] = await reviewRepo.findAndCount({
    where: {
      targetId,
      status: ReviewStatus.APPROVED,
    },
    order: { createdAt: 'DESC' },
    take: limit,
    skip,
  });

  return {
    reviews: reviews.map(mapReviewToInterface),
    total,
  };
};

export const updateStatus = async (id: string, status: ReviewStatus): Promise<IReview> => {
  const reviewRepo = getReviewRepository();

  await reviewRepo.update(id, { status });

  const review = await reviewRepo.findOne({ where: { id } });
  if (!review) throw new Error('Review not found');

  // Publish event
  const eventType = status === ReviewStatus.APPROVED 
    ? EventType.REVIEW_APPROVED 
    : EventType.REVIEW_REJECTED;

  const event: IEvent = {
    id: uuidv4(),
    type: eventType,
    timestamp: new Date(),
    payload: { reviewId: id },
  };
  await publishEvent(event);

  return mapReviewToInterface(review);
};

const mapReviewToInterface = (review: Review): IReview => {
  return {
    id: review.id,
    type: review.type,
    targetId: review.targetId,
    customerId: review.customerId,
    orderId: review.orderId,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    images: review.images,
    status: review.status,
    helpfulCount: review.helpfulCount,
    verifiedPurchase: review.verifiedPurchase,
    sellerResponse: review.sellerResponse,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
};
