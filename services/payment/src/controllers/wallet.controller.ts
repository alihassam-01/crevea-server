import { successResponse } from '@crevea/shared';

export const getWallet = async (userId: string) => {
  // Wallet service implementation
  return successResponse({
    userId,
    balance: 0,
    currency: 'ZAR',
  });
};

export const getTransactions = async (_userId: string, options: { page: number; limit: number }) => {
  // Get wallet transactions
  return successResponse({
    data: [],
    meta: {
      page: options.page,
      limit: options.limit,
      total: 0,
      totalPages: 0,
    },
  });
};
