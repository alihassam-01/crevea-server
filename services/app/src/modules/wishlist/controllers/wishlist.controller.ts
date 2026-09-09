import { successResponse } from '@crevea/shared';
import * as wishlistService from '../services/wishlist.service';

export const list = async (userId: string) => {
  return successResponse({ productIds: await wishlistService.listProductIds(userId) });
};

export const add = async (userId: string, productId: string) => {
  await wishlistService.addProduct(userId, productId);
  return successResponse({ productId, wishlisted: true });
};

export const remove = async (userId: string, productId: string) => {
  await wishlistService.removeProduct(userId, productId);
  return successResponse({ productId, wishlisted: false });
};
