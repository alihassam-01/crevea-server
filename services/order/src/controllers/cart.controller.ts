import { successResponse } from '@crevea/shared';
import * as cartService from '../services/cart.service';

export const getCart = async (userId: string) => {
  const cart = await cartService.getCart(userId);
  return successResponse(cart);
};

export const addItem = async (userId: string, item: any) => {
  if (!item.shopId) {
    const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003';
    try {
      const response = await fetch(`${PRODUCT_SERVICE_URL}/api/products/${item.productId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch product details: ${response.statusText}`);
      }
      const productResponse = await response.json();
      if (productResponse.success && productResponse.data) {
         item.shopId = productResponse.data.shopId;
      } else {
         throw new Error('Invalid product response');
      }
    } catch (error: any) {
      throw new Error(`Could not retrieve shop information for product: ${error.message}`);
    }
  }

  const cart = await cartService.addItem(userId, item);
  return successResponse(cart);
};

export const updateItem = async (
  userId: string,
  productId: string,
  quantity: number,
  variationId?: string
) => {
  const cart = await cartService.updateItem(userId, productId, quantity, variationId);
  return successResponse(cart);
};

export const removeItem = async (userId: string, productId: string, variationId?: string) => {
  const cart = await cartService.removeItem(userId, productId, variationId);
  return successResponse(cart);
};

export const clearCart = async (userId: string) => {
  await cartService.clearCart(userId);
};
