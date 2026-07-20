import { getSellerEarningsRepository, SellerEarnings, getShopRepository } from '../config/database';
import { ISellerEarnings, ISellerBalance } from '@crevea/shared';

interface RecordEarningData {
  shopId: string;
  orderId: string;
  grossAmount: number;
}

export const recordEarning = async (data: RecordEarningData): Promise<ISellerEarnings> => {
  const earningsRepo = getSellerEarningsRepository();
  const shopRepo = getShopRepository();

  // Get shop's current commission rate
  const shop = await shopRepo.findOne({ where: { id: data.shopId } });
  if (!shop) throw new Error('Shop not found');

  const commissionRate = parseFloat(shop.commissionRate.toString());
  const commissionAmount = (data.grossAmount * commissionRate) / 100;
  const netAmount = data.grossAmount - commissionAmount;

  const earning = earningsRepo.create({
    shopId: data.shopId,
    orderId: data.orderId,
    grossAmount: data.grossAmount,
    commissionRate,
    commissionAmount,
    netAmount,
    status: 'COMPLETED',
  });

  await earningsRepo.save(earning);

  return mapEarningToInterface(earning);
};

export const getShopBalance = async (shopId: string): Promise<ISellerBalance> => {
  const earningsRepo = getSellerEarningsRepository();

  // Get all completed earnings
  const earnings = await earningsRepo.find({
    where: { shopId, status: 'COMPLETED' },
  });

  const totalEarnings = earnings.reduce((sum, e) => sum + parseFloat(e.grossAmount.toString()), 0);
  const totalCommission = earnings.reduce((sum, e) => sum + parseFloat(e.commissionAmount.toString()), 0);
  const netEarnings = earnings.reduce((sum, e) => sum + parseFloat(e.netAmount.toString()), 0);

  // Get payout totals
  const { getPayoutRepository } = await import('../config/database');
  const payoutRepo = getPayoutRepository();

  const completedPayouts = await payoutRepo.find({
    where: { shopId, status: 'COMPLETED' },
  });

  const pendingPayouts = await payoutRepo.find({
    where: { shopId, status: 'APPROVED' },
  });

  const payoutsCompleted = completedPayouts.reduce(
    (sum, p) => sum + parseFloat(p.approvedAmount?.toString() || p.requestedAmount.toString()),
    0
  );

  const payoutsPending = pendingPayouts.reduce(
    (sum, p) => sum + parseFloat(p.approvedAmount?.toString() || p.requestedAmount.toString()),
    0
  );

  const pendingBalance = netEarnings - payoutsCompleted - payoutsPending;

  return {
    totalEarnings,
    totalCommission,
    netEarnings,
    pendingBalance,
    payoutsCompleted,
    payoutsPending,
  };
};

export const getEarningsHistory = async (
  shopId: string,
  options: { page: number; limit: number }
): Promise<{ earnings: ISellerEarnings[]; total: number }> => {
  const earningsRepo = getSellerEarningsRepository();
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [earnings, total] = await earningsRepo.findAndCount({
    where: { shopId },
    order: { createdAt: 'DESC' },
    take: limit,
    skip,
  });

  return {
    earnings: earnings.map(mapEarningToInterface),
    total,
  };
};

const mapEarningToInterface = (earning: SellerEarnings): ISellerEarnings => {
  return {
    id: earning.id,
    shopId: earning.shopId,
    orderId: earning.orderId,
    grossAmount: parseFloat(earning.grossAmount.toString()),
    commissionRate: parseFloat(earning.commissionRate.toString()),
    commissionAmount: parseFloat(earning.commissionAmount.toString()),
    netAmount: parseFloat(earning.netAmount.toString()),
    status: earning.status as any,
    createdAt: earning.createdAt,
    updatedAt: earning.updatedAt,
  };
};
