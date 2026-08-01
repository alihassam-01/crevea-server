import { successResponse } from '@crevea/shared';
import * as earningsService from '../services/seller-earnings.service';
import * as payoutService from '../services/payout.service';

export const getBalance = async (shopId: string) => {
  const balance = await earningsService.getShopBalance(shopId);
  return successResponse(balance);
};

export const getEarningsHistory = async (shopId: string, page: number, limit: number) => {
  const result = await earningsService.getEarningsHistory(shopId, { page, limit });
  return successResponse(result.earnings, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
  });
};

export const requestPayout = async (shopId: string, data: any) => {
  const payout = await payoutService.requestPayout(shopId, data.amount, {
    method: data.paymentMethod,
    ...data.paymentDetails,
  });
  return successResponse(payout);
};

export const getPayouts = async (shopId: string) => {
  const payouts = await payoutService.getShopPayouts(shopId);
  return successResponse(payouts);
};
