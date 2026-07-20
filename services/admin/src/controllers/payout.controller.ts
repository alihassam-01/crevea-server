import { successResponse } from '@crevea/shared';
import axios from 'axios';

const SHOP_SERVICE_URL = process.env.SHOP_SERVICE_URL || 'http://localhost:3002';

export const getPendingPayouts = async () => {
  const response = await axios.get(`${SHOP_SERVICE_URL}/api/admin/payouts/pending`);
  return successResponse(response.data.data);
};

export const approvePayout = async (payoutId: string, data: { approvedAmount: number; notes?: string }, adminId: string) => {
  const response = await axios.post(
    `${SHOP_SERVICE_URL}/api/admin/payouts/${payoutId}/approve`,
    { ...data, adminId }
  );
  return successResponse(response.data.data);
};

export const rejectPayout = async (payoutId: string, data: { reason: string }) => {
  await axios.post(`${SHOP_SERVICE_URL}/api/admin/payouts/${payoutId}/reject`, data);
  return successResponse({ message: 'Payout rejected successfully' });
};

export const completePayout = async (payoutId: string) => {
  const response = await axios.post(`${SHOP_SERVICE_URL}/api/admin/payouts/${payoutId}/complete`);
  return successResponse(response.data.data);
};

export const updateShopCommission = async (shopId: string, data: { commissionRate: number }, adminId: string) => {
  const response = await axios.put(
    `${SHOP_SERVICE_URL}/api/admin/shops/${shopId}/commission`,
    { ...data, adminId }
  );
  return successResponse(response.data.data);
};
