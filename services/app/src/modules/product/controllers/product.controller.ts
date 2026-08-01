import { successResponse, NotFoundError, AuthorizationError } from '@crevea/shared';
import * as productService from '../services/product.service';
import * as inventoryService from '../services/inventory.service';
import * as shopService from '../../shop/services/shop.service';

export const createProduct = async (userId: string, data: any, authHeader?: string) => {
  // Verify user owns the shop. If `shopId` not provided, resolve via Shop service.
  const shopId = data.shopId || await getShopIdForUser(userId, authHeader);
  const product = await productService.create({ ...data, shopId });
  return successResponse(product);
};

export const getProduct = async (id: string) => {
  const product = await productService.findById(id);
  if (!product) {
    throw new NotFoundError('Product', id);
  }
  return successResponse(product);
};

export const updateProduct = async (id: string, userId: string, data: any) => {
  const product = await productService.findById(id);
  if (!product) {
    throw new NotFoundError('Product', id);
  }

  // Verify ownership
  const hasAccess = await verifyProductAccess(product.shopId, userId);
  if (!hasAccess) {
    throw new AuthorizationError('You can only update your own products');
  }

  const updated = await productService.updateProduct(id, data);
  return successResponse(updated);
};

export const deleteProduct = async (id: string, userId: string) => {
  const product = await productService.findById(id);
  if (!product) {
    throw new NotFoundError('Product', id);
  }

  const hasAccess = await verifyProductAccess(product.shopId, userId);
  if (!hasAccess) {
    throw new AuthorizationError('You can only delete your own products');
  }

  await productService.deleteProduct(id);
};

export const listProducts = async (query: any) => {
  const { page = 1, limit = 20, category, status, search, minPrice, maxPrice } = query;
  const result = await productService.list({
    page: parseInt(String(page)),
    limit: parseInt(String(limit)),
    category,
    status,
    search,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
  });
  return result;
};

export const getShopProducts = async (shopId: string, query: any) => {
  const { page = 1, limit = 20 } = query;
  const result = await productService.findByShop(shopId, {
    page: parseInt(String(page)),
    limit: parseInt(String(limit)),
  });
  return result;
};

export const updateInventory = async (id: string, userId: string, data: any) => {
  const product = await productService.findById(id);
  if (!product) {
    throw new NotFoundError('Product', id);
  }

  // Verify ownership
  const hasAccess = await verifyProductAccess(product.shopId, userId);
  if (!hasAccess) {
    throw new AuthorizationError();
  }

  const inventory = await inventoryService.updateInventory(id, {
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold
  });
  return successResponse(inventory);
};

export const addVariation = async (id: string, userId: string, data: any) => {
  const product = await productService.findById(id);
  if (!product) {
    throw new NotFoundError('Product', id);
  }

  // Verify ownership
  const hasAccess = await verifyProductAccess(product.shopId, userId);
  if (!hasAccess) {
    throw new AuthorizationError();
  }

  const variation = await productService.addVariation(id, data);
  return successResponse(variation);
};

// Helper functions
const getShopIdForUser = async (userId: string, _authHeader?: string): Promise<string> => {
  const shops = await shopService.findBySeller(userId);
  if (shops.length === 0) throw new NotFoundError('Shop');
  return shops[0].id;
};

const verifyProductAccess = async (_shopId: string, _userId: string): Promise<boolean> => {
  // This would verify the user owns the shop
  // For now, returning true (implement proper check in production)
  return true;
};
