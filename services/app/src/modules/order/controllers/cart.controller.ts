import { successResponse } from '@crevea/shared';
import * as cartService from '../services/cart.service';
import * as productService from '../../product/services/product.service';

export const getCart = async (userId: string) => {
  const cart = await cartService.getCart(userId);
  return successResponse(cart);
};

export const addItem = async (userId: string, item: any) => {
  const product = await productService.findById(item.productId);
  if (!product) throw new Error('Product not found');
  // Never trust pricing or shop ownership metadata sent by the browser.
  item.shopId = product.shopId;
  item.price = product.price;
  item.productName = product.name;
  item.productImage = product.images?.[0];

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
