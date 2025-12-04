import { successResponse } from '@crevea/shared';

export const createDiscount = async (data: any) => {
  // Create discount code
  const discount = {
    id: 'discount-id',
    ...data,
    usageCount: 0,
    createdAt: new Date(),
  };

  return successResponse(discount);
};

export const validateDiscount = async (code: string) => {
  // Validate discount code
  const isValid = true; // Check against database
  const discount = isValid ? {
    code,
    discountType: 'PERCENTAGE',
    discountValue: 10,
    valid: true,
  } : { valid: false };

  return successResponse(discount);
};

export const getActivePromotions = async () => {
  // Get active promotions
  return successResponse([]);
};

export const getFeaturedProducts = async () => {
  // Get featured products
  return successResponse([]);
};
