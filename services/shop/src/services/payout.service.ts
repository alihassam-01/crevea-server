import { getPayoutRepository, Payout } from '../config/database';
import { IPayout } from '@crevea/shared';
import * as earningsService from './seller-earnings.service';

export const requestPayout = async (
  shopId: string,
  amount: number,
  paymentDetails: any
): Promise<IPayout> => {
  const payoutRepo = getPayoutRepository();

  // Check if seller has enough balance
  const balance = await earningsService.getShopBalance(shopId);
  if (amount > balance.pendingBalance) {
    throw new Error(`Insufficient balance. Available: R${balance.pendingBalance.toFixed(2)}`);
  }

  const payout = payoutRepo.create({
    shopId,
    requestedAmount: amount,
    paymentMethod: paymentDetails.method || 'BANK_TRANSFER',
    paymentDetails,
    status: 'PENDING',
  });

  await payoutRepo.save(payout);

  return mapPayoutToInterface(payout);
};

export const getShopPayouts = async (shopId: string): Promise<IPayout[]> => {
  const payoutRepo = getPayoutRepository();

  const payouts = await payoutRepo.find({
    where: { shopId },
    order: { requestedAt: 'DESC' },
  });

  return payouts.map(mapPayoutToInterface);
};

export const approvePayout = async (
  payoutId: string,
  approvedAmount: number,
  adminId: string,
  notes?: string
): Promise<IPayout> => {
  const payoutRepo = getPayoutRepository();

  const payout = await payoutRepo.findOne({ where: { id: payoutId } });
  if (!payout) throw new Error('Payout not found');

  if (payout.status !== 'PENDING') {
    throw new Error('Only pending payouts can be approved');
  }

  await payoutRepo.update(payoutId, {
    status: 'APPROVED',
    approvedAmount,
    approvedBy: adminId,
    approvedAt: new Date(),
    notes,
  });

  const updated = await payoutRepo.findOne({ where: { id: payoutId } });
  if (!updated) throw new Error('Payout not found after update');

  return mapPayoutToInterface(updated);
};

export const rejectPayout = async (payoutId: string, reason: string): Promise<void> => {
  const payoutRepo = getPayoutRepository();

  const payout = await payoutRepo.findOne({ where: { id: payoutId } });
  if (!payout) throw new Error('Payout not found');

  await payoutRepo.update(payoutId, {
    status: 'REJECTED',
    rejectionReason: reason,
  });
};

export const completePayout = async (payoutId: string): Promise<IPayout> => {
  const payoutRepo = getPayoutRepository();

  const payout = await payoutRepo.findOne({ where: { id: payoutId } });
  if (!payout) throw new Error('Payout not found');

  if (payout.status !== 'APPROVED') {
    throw new Error('Only approved payouts can be marked as completed');
  }

  await payoutRepo.update(payoutId, {
    status: 'COMPLETED',
    completedAt: new Date(),
  });

  const updated = await payoutRepo.findOne({ where: { id: payoutId } });
  if (!updated) throw new Error('Payout not found after update');

  return mapPayoutToInterface(updated);
};

export const getPendingPayouts = async (): Promise<IPayout[]> => {
  const payoutRepo = getPayoutRepository();

  const payouts = await payoutRepo.find({
    where: { status: 'PENDING' },
    order: { requestedAt: 'ASC' },
  });

  return payouts.map(mapPayoutToInterface);
};

const mapPayoutToInterface = (payout: Payout): IPayout => {
  return {
    id: payout.id,
    shopId: payout.shopId,
    requestedAmount: parseFloat(payout.requestedAmount.toString()),
    approvedAmount: payout.approvedAmount ? parseFloat(payout.approvedAmount.toString()) : undefined,
    status: payout.status as any,
    requestedAt: payout.requestedAt,
    approvedAt: payout.approvedAt,
    completedAt: payout.completedAt,
    approvedBy: payout.approvedBy,
    paymentMethod: payout.paymentMethod,
    paymentDetails: payout.paymentDetails,
    notes: payout.notes,
    rejectionReason: payout.rejectionReason,
    updatedAt: payout.updatedAt,
  };
};
