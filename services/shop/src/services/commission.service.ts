import { getShopRepository } from '../config/database';

export const updateShopCommission = async (
  shopId: string,
  newRate: number,
  adminId: string
): Promise<void> => {
  const shopRepo = getShopRepository();

  const shop = await shopRepo.findOne({ where: { id: shopId } });
  if (!shop) throw new Error('Shop not found');

  // Validate commission rate
  if (newRate < 0 || newRate > 100) {
    throw new Error('Commission rate must be between 0 and 100');
  }

  await shopRepo.update(shopId, {
    commissionRate: newRate,
  });

  // TODO: Log commission rate change for audit trail
  // Could create a CommissionHistory entity for tracking
};

export const getShopCommissionRate = async (shopId: string): Promise<number> => {
  const shopRepo = getShopRepository();

  const shop = await shopRepo.findOne({ where: { id: shopId } });
  if (!shop) throw new Error('Shop not found');

  return parseFloat(shop.commissionRate.toString());
};
