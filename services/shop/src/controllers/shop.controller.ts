import { successResponse, NotFoundError, AuthorizationError, ConflictError } from '@crevea/shared';
import * as shopService from '../services/shop.service';
import * as analyticsService from '../services/analytics.service';
import { ShopStatus, VerificationStatus } from '@crevea/shared';

export const createShop = async (sellerId: string, data: any) => {
  // Check if seller already has a shop
  const existingShop = await shopService.findBySellerId(sellerId);
  if (existingShop) {
    throw new ConflictError('Seller already has a shop');
  }

  const shop = await shopService.create(sellerId, data);
  return successResponse(shop);
};

export const getShop = async (id: string) => {
  const shop = await shopService.findById(id);
  if (!shop) {
    throw new NotFoundError('Shop', id);
  }
  return successResponse(shop);
};

export const updateShop = async (id: string, userId: string, data: any) => {
  const shop = await shopService.findById(id);
  if (!shop) {
    throw new NotFoundError('Shop', id);
  }

  // Check ownership
  if (shop.sellerId !== userId) {
    throw new AuthorizationError('You can only update your own shop');
  }

  const updated = await shopService.update(id, data);
  return successResponse(updated);
};

export const deleteShop = async (id: string, userId: string) => {
  const shop = await shopService.findById(id);
  if (!shop) {
    throw new NotFoundError('Shop', id);
  }

  if (shop.sellerId !== userId) {
    throw new AuthorizationError('You can only delete your own shop');
  }

  await shopService.deleteShop(id);
};

export const listShops = async (query: any) => {
  const { page = 1, limit = 20, category, status, search } = query;
  const result = await shopService.list({
    page: parseInt(page),
    limit: parseInt(limit),
    category,
    status,
    search,
  });
  return result;
};

export const submitVerification = async (id: string, userId: string, documents: string[]) => {
  const shop = await shopService.findById(id);
  if (!shop) {
    throw new NotFoundError('Shop', id);
  }

  if (shop.sellerId !== userId) {
    throw new AuthorizationError('You can only verify your own shop');
  }

  const updated = await shopService.submitVerification(id, documents);
  return successResponse(updated);
};

export const updateShopStatus = async (id: string, status: string, notes?: string) => {
  const shop = await shopService.findById(id);
  if (!shop) {
    throw new NotFoundError('Shop', id);
  }

  const updated = await shopService.updateStatus(id, status as ShopStatus, notes);
  return successResponse(updated);
};

export const getAnalytics = async (id: string, period: string) => {
  const shop = await shopService.findById(id);
  if (!shop) {
    throw new NotFoundError('Shop', id);
  }

  const analytics = await analyticsService.getShopAnalytics(id, period);
  return successResponse(analytics);
};

export const getSellerShops = async (sellerId: string) => {
  const shop = await shopService.findBySellerId(sellerId);
  return successResponse(shop ? [shop] : []);
};
