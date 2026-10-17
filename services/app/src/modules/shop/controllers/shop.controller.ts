import { successResponse, NotFoundError, AuthorizationError, ConflictError, ValidationError } from '@crevea/shared';
import { getUserRepository } from '../../../database';
import * as shopService from '../services/shop.service';
import * as analyticsService from '../services/analytics.service';
import { ShopStatus, VerificationStatus } from '@crevea/shared';
import { assertOwnedVerificationAssets, deleteEntityAssets } from '../../asset/services/asset.service';

export const createShop = async (sellerId: string, data: any) => {
  const seller = await getUserRepository().findOne({ where: { id: sellerId } });
  const onboarding = seller?.preferences && typeof seller.preferences === 'object' && !Array.isArray(seller.preferences)
    ? (seller.preferences as { vendorOnboarding?: { status?: string; documents?: unknown[] } }).vendorOnboarding
    : undefined;
  if (onboarding?.status !== 'PENDING' && onboarding?.status !== 'APPROVED') {
    throw new ValidationError('Complete vendor onboarding before creating a shop');
  }
  if (!onboarding.documents || onboarding.documents.length !== 3) {
    throw new ValidationError('CNIC front, CNIC back, and business proof are required');
  }
  await assertOwnedVerificationAssets(sellerId, onboarding.documents as string[]);
  // Check if seller already has a shop
  const existingShops = await shopService.findBySeller(sellerId);
  if (existingShops && existingShops.length > 0) {
    throw new ConflictError('Seller already has a shop');
  }

  const shop = await shopService.create({ ...data, sellerId });
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

  const updated = await shopService.updateShop(id, data);
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

  await deleteEntityAssets('shops', id);
  await shopService.deleteShop(id);
};

export const listShops = async (query: any) => {
  const { page = 1, limit = 20, category, status, search, isVerified, sortBy } = query;
  
  const options: any = {
    page: parseInt(String(page)),
    limit: parseInt(String(limit)),
    category,
    status,
    search,
    sortBy,
  };

  if (isVerified === 'true') {
    options.verificationStatus = 'APPROVED';
  }

  const result = await shopService.search(query.search || '', options);
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

  // Placeholder - implement verification submission
  const updated = await shopService.updateShop(id, { verificationDocuments: documents });
  return successResponse(updated);
};

export const updateShopStatus = async (id: string, status: string, _notes?: string) => {
  const shop = await shopService.findById(id);
  if (!shop) {
    throw new NotFoundError('Shop', id);
  }

  const nextStatus = status as ShopStatus;
  const nextVerificationStatus = nextStatus === ShopStatus.ACTIVE
    ? VerificationStatus.APPROVED
    : nextStatus === ShopStatus.SUSPENDED || nextStatus === ShopStatus.CLOSED
      ? VerificationStatus.REJECTED
      : VerificationStatus.PENDING;
  const updated = await shopService.updateShop(id, {
    status: nextStatus,
    verificationStatus: nextVerificationStatus,
  });
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
  const shops = await shopService.findBySeller(sellerId);
  return successResponse(shops);
};

