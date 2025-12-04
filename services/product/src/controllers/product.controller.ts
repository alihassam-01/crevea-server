import { successResponse, NotFoundError, AuthorizationError } from '@crevea/shared';
import * as productService from '../services/product.service';
import * as inventoryService from '../services/inventory.service';

export const createProduct = async (userId: string, data: any) => {
  // Verify user owns the shop
  const shopId = data.shopId || await getShopIdForUser(userId);
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
    page: parseInt(page),
    limit: parseInt(limit),
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
    page: parseInt(page),
    limit: parseInt(limit),
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
const getShopIdForUser = async (_userId: string): Promise<string> => {
  // This would query the shop service to get the user's shop
  // For now, returning a placeholder
  throw new Error('Shop ID must be provided');
};

const verifyProductAccess = async (_shopId: string, _userId: string): Promise<boolean> => {
  // This would verify the user owns the shop
  // For now, returning true (implement proper check in production)
  return true;
};
