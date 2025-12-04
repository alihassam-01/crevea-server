import { successResponse, paginatedResponse } from '@crevea/shared';
import { ReviewStatus } from '@crevea/shared';
import * as reviewService from '../services/review.service';

export const createReview = async (userId: string, data: any) => {
  const review = await reviewService.create({
    ...data,
    customerId: userId,
  });
  return successResponse(review);
};

export const getReviews = async (targetId: string, options: { page: number; limit: number }) => {
  const { reviews, total } = await reviewService.findByTarget(targetId, options);
  return paginatedResponse(reviews, options.page, options.limit, total);
};

export const approveReview = async (id: string) => {
  const review = await reviewService.updateStatus(id, ReviewStatus.APPROVED);
  return successResponse(review);
};

export const rejectReview = async (id: string) => {
  const review = await reviewService.updateStatus(id, ReviewStatus.REJECTED);
  return successResponse(review);
};
