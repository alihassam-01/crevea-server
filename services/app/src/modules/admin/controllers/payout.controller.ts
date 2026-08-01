import { successResponse } from '@crevea/shared';
import * as payoutService from '../../shop/services/payout.service';
import * as commissionService from '../../shop/services/commission.service';

export const getPendingPayouts = async () => {
  return successResponse(await payoutService.getPendingPayouts());
};

export const approvePayout = async (payoutId: string, data: { approvedAmount: number; notes?: string }, adminId: string) => {
  return successResponse(await payoutService.approvePayout(payoutId, data.approvedAmount, adminId, data.notes));
};

export const rejectPayout = async (payoutId: string, data: { reason: string }) => {
  await payoutService.rejectPayout(payoutId, data.reason);
  return successResponse({ message: 'Payout rejected successfully' });
};

export const completePayout = async (payoutId: string) => {
  return successResponse(await payoutService.completePayout(payoutId));
};

export const updateShopCommission = async (shopId: string, data: { commissionRate: number }, adminId: string) => {
  await commissionService.updateShopCommission(shopId, data.commissionRate, adminId);
  return successResponse({ message: 'Shop commission updated successfully' });
};
