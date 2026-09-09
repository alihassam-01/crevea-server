import { getProductRepository, getWishlistRepository, WishlistItem } from '../../../database';
import { v4 as uuidv4 } from 'uuid';

export const listProductIds = async (userId: string): Promise<string[]> => {
  const items = await getWishlistRepository().find({ where: { userId }, order: { createdAt: 'DESC' } });
  return items.map((item: WishlistItem) => item.productId);
};

export const addProduct = async (userId: string, productId: string): Promise<void> => {
  const product = await getProductRepository().findOne({ where: { id: productId } });
  if (!product) throw new Error('Product not found');

  const repository = getWishlistRepository();
  const existing = await repository.findOne({ where: { userId, productId } });
  if (!existing) {
    await repository.save(repository.create({ id: uuidv4(), userId, productId, createdAt: new Date() }) as WishlistItem);
  }
};

export const removeProduct = async (userId: string, productId: string): Promise<void> => {
  await getWishlistRepository().delete({ userId, productId });
};
