import { getRedis } from '../config/redis';
import { ICart, ICartItem } from '@crevea/shared';

const CART_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export const getCart = async (userId: string): Promise<ICart> => {
  const redis = getRedis();
  const key = `cart:${userId}`;
  
  const data = await redis.get(key);
  if (!data) {
    return {
      userId,
      items: [],
      subtotal: 0,
      updatedAt: new Date(),
    };
  }

  return JSON.parse(data);
};

export const addItem = async (userId: string, item: ICartItem): Promise<ICart> => {
  const cart = await getCart(userId);
  
  // Check if item already exists
  const existingIndex = cart.items.findIndex(
    i => i.productId === item.productId && i.variationId === item.variationId
  );

  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += item.quantity;
  } else {
    cart.items.push(item);
  }

  cart.subtotal = calculateSubtotal(cart.items);
  cart.updatedAt = new Date();

  await saveCart(userId, cart);
  return cart;
};

export const updateItem = async (
  userId: string,
  productId: string,
  quantity: number,
  variationId?: string
): Promise<ICart> => {
  const cart = await getCart(userId);
  
  const itemIndex = cart.items.findIndex(
    i => i.productId === productId && i.variationId === variationId
  );

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
  }

  cart.subtotal = calculateSubtotal(cart.items);
  cart.updatedAt = new Date();

  await saveCart(userId, cart);
  return cart;
};

export const removeItem = async (
  userId: string,
  productId: string,
  variationId?: string
): Promise<ICart> => {
  const cart = await getCart(userId);
  
  cart.items = cart.items.filter(
    i => !(i.productId === productId && i.variationId === variationId)
  );

  cart.subtotal = calculateSubtotal(cart.items);
  cart.updatedAt = new Date();

  await saveCart(userId, cart);
  return cart;
};

export const clearCart = async (userId: string): Promise<void> => {
  const redis = getRedis();
  await redis.del(`cart:${userId}`);
};

const saveCart = async (userId: string, cart: ICart): Promise<void> => {
  const redis = getRedis();
  const key = `cart:${userId}`;
  await redis.setex(key, CART_TTL, JSON.stringify(cart));
};

const calculateSubtotal = (items: ICartItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};
