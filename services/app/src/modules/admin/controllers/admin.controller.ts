import {
  ContentPage,
  getContentPageRepository,
  getOrderItemRepository,
  getOrderRepository,
  getProductRepository,
  getReviewRepository,
  getSellerEarningsRepository,
  getShopRepository,
  getUserRepository,
  Order,
  Shop,
  User,
} from '../../../database';
import { getRedis } from '../../../redis';
import { hashPassword, OrderStatus, paginatedResponse, ReviewStatus, successResponse, UserRole, UserStatus, VerificationStatus } from '@crevea/shared';
import * as shopService from '../../shop/services/shop.service';
import * as userService from '../../auth/services/user.service';
import { EXECUTIVE_CONTENT_KEYS, ExecutiveContentKey } from '../admin.constants';

export interface PageFilter {
  page: number;
  limit: number;
}

export interface UserFilter extends PageFilter {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface OrderFilter extends PageFilter {
  search?: string;
  status?: string;
  customerId?: string;
  from?: Date;
  to?: Date;
}

export interface EarningsFilter extends PageFilter {
  vendorId?: string;
  shopId?: string;
  from?: Date;
  to?: Date;
}

const dateRange = (from?: Date, to?: Date): Record<string, Date> | undefined => {
  if (!from && !to) return undefined;
  return { ...(from ? { __gt: from } : {}), ...(to ? { __lt: to } : {}) };
};

const mapUser = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  status: user.status,
  emailVerified: user.emailVerified,
  mfaEnabled: user.mfaEnabled,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getDashboardStats = async () => {
  const [users, vendors, shops, products, orders] = await Promise.all([
    getUserRepository().find(),
    getUserRepository().find({ where: { role: UserRole.VENDOR } }),
    getShopRepository().find(),
    getProductRepository().find(),
    getOrderRepository().find(),
  ]);
  const revenue = orders
    .filter(order => order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.REFUNDED)
    .reduce((total, order) => total + Number(order.total), 0);

  return successResponse({
    totalUsers: users.length,
    totalVendors: vendors.length,
    totalShops: shops.length,
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: revenue,
    pendingShops: shops.filter(shop => shop.verificationStatus === VerificationStatus.PENDING).length,
  });
};

export const getUsers = async (filters: UserFilter) => {
  const where: Record<string, unknown> = {};
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { email: { __contains: filters.search } },
      { firstName: { __contains: filters.search } },
      { lastName: { __contains: filters.search } },
    ];
  }
  const [users, total] = await getUserRepository().findAndCount({
    where,
    order: { createdAt: 'DESC' },
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  });
  return paginatedResponse(users.map(mapUser), filters.page, filters.limit, total);
};

export const getVendors = async (filters: PageFilter & { search?: string; status?: string }) =>
  getUsers({ ...filters, role: UserRole.VENDOR, status: filters.status as UserStatus | undefined });

export const getOrders = async (filters: OrderFilter) => {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customerId = filters.customerId;
  const range = dateRange(filters.from, filters.to);
  if (range) where.createdAt = range;
  if (filters.search) where.orderNumber = { __contains: filters.search };
  const [orders, total] = await getOrderRepository().findAndCount({
    where,
    order: { createdAt: 'DESC' },
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  });
  return paginatedResponse(orders, filters.page, filters.limit, total);
};

export const getRevenue = async (filters: Pick<OrderFilter, 'from' | 'to' | 'status'>) => {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  const range = dateRange(filters.from, filters.to);
  if (range) where.createdAt = range;
  const orders = await getOrderRepository().find({ where });
  const eligible = orders.filter(order => order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.REFUNDED);
  return successResponse({
    totalRevenue: eligible.reduce((sum, order) => sum + Number(order.total), 0),
    orderCount: eligible.length,
    averageOrderValue: eligible.length
      ? eligible.reduce((sum, order) => sum + Number(order.total), 0) / eligible.length
      : 0,
  });
};

export const getVendorEarnings = async (filters: EarningsFilter) => {
  let shopIds: string[] | undefined;
  if (filters.shopId) shopIds = [filters.shopId];
  if (filters.vendorId) {
    const shops = await getShopRepository().find({ where: { sellerId: filters.vendorId } });
    shopIds = shops.map(shop => shop.id);
  }
  if (shopIds && shopIds.length === 0) return paginatedResponse([], filters.page, filters.limit, 0);
  const where: Record<string, unknown> = {};
  if (shopIds) where.shopId = { __in: shopIds };
  const range = dateRange(filters.from, filters.to);
  if (range) where.createdAt = range;
  const [earnings, total] = await getSellerEarningsRepository().findAndCount({
    where,
    order: { createdAt: 'DESC' },
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  });
  return paginatedResponse(earnings, filters.page, filters.limit, total);
};

export const getVendorAnalytics = async (vendorId: string, from?: Date, to?: Date) => {
  const shops = await getShopRepository().find({ where: { sellerId: vendorId } });
  const shopIds = shops.map(shop => shop.id);
  if (shopIds.length === 0) return successResponse({ vendorId, shops: [], totalRevenue: 0, totalOrders: 0, totalProducts: 0 });
  const range = dateRange(from, to);
  const orderItems = await getOrderItemRepository().find({ where: { shopId: { __in: shopIds } } });
  const orderIds = [...new Set(orderItems.map(item => item.orderId))];
  const orders = orderIds.length
    ? await getOrderRepository().find({ where: { id: { __in: orderIds }, ...(range ? { createdAt: range } : {}) } })
    : [];
  const products = await getProductRepository().find({ where: { shopId: { __in: shopIds } } });
  const earnings = await getSellerEarningsRepository().find({ where: { shopId: { __in: shopIds } } });
  return successResponse({
    vendorId,
    shops,
    totalRevenue: earnings.reduce((sum, earning) => sum + Number(earning.grossAmount), 0),
    totalOrders: orders.length,
    totalProducts: products.length,
    earnings,
  });
};

export const createVendor = async (data: {
  email: string; password: string; firstName: string; lastName: string;
}) => {
  const user = await userService.create({
    ...data,
    passwordHash: await hashPassword(data.password),
    role: UserRole.VENDOR,
    emailVerified: true,
  });
  return successResponse(mapUser(user as User));
};

export const updateUser = async (id: string, data: { status?: UserStatus; role?: UserRole }) => {
  const user = await userService.updateUser(id, data);
  return successResponse(user);
};

export const createVendorShop = async (vendorId: string, data: Omit<Parameters<typeof shopService.create>[0], 'sellerId'>) => {
  const vendor = await getUserRepository().findOne({ where: { id: vendorId } });
  if (!vendor || vendor.role !== UserRole.VENDOR) throw new Error('A valid vendor account is required');
  const existingShops = await shopService.findBySeller(vendorId);
  if (existingShops.length > 0) throw new Error('Vendor already has a shop');
  return successResponse(await shopService.create({ ...data, sellerId: vendorId }));
};

export const getPendingShops = async (filters: PageFilter) => {
  const [shops, total] = await getShopRepository().findAndCount({
    where: { verificationStatus: VerificationStatus.PENDING },
    order: { createdAt: 'ASC' },
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  });
  return paginatedResponse(shops, filters.page, filters.limit, total);
};

export const getPendingReviews = async (filters: PageFilter) => {
  const [reviews, total] = await getReviewRepository().findAndCount({
    where: { status: ReviewStatus.PENDING },
    order: { createdAt: 'ASC' },
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  });
  return paginatedResponse(reviews, filters.page, filters.limit, total);
};

export const getSystemHealth = async () => successResponse({
  redis: await getRedis().ping() === 'PONG',
  database: true,
  timestamp: new Date().toISOString(),
});

export const getContentPage = async (key: ExecutiveContentKey) => {
  const page = await getContentPageRepository().findOne({ where: { key } });
  return successResponse(page);
};

export const upsertContentPage = async (key: ExecutiveContentKey, data: { title: string; body: string; published: boolean }, userId: string) => {
  const repository = getContentPageRepository();
  const existing = await repository.findOne({ where: { key } });
  if (existing) {
    await repository.update(existing.id, { ...data, version: existing.version + 1, updatedAt: new Date() });
  } else {
    await repository.save(repository.create({ ...data, published: data.published ?? false, key, createdBy: userId, version: 1 }));
  }
  return getContentPage(key);
};
