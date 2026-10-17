import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
} from './generated/prisma/client';
import {
  EmailVerificationToken, Inventory, Notification, OAuthAccount, OrderItem, Order,
  PasswordResetToken, Payment, Payout, ProductVariation, Product, ReturnRequest,
  Review, SellerEarnings, Session, Shop, SizeChart, User,
  Message, ContentPage, VendorStory, WishlistItem, Asset, Coupon,
} from './database.types';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

type QueryOptions = {
  where?: Record<string, unknown> | Array<Record<string, unknown>>;
  order?: Record<string, 'ASC' | 'DESC'>;
  take?: number;
  skip?: number;
};

type PrismaDelegate<T> = {
  create(args: { data: unknown }): Promise<T>;
  createMany(args: { data: unknown }): Promise<{ count: number }>;
  findFirst(args: { where?: unknown; orderBy?: unknown }): Promise<T | null>;
  findMany(args?: { where?: unknown; orderBy?: unknown; take?: number; skip?: number }): Promise<T[]>;
  count(args?: { where?: unknown }): Promise<number>;
  updateMany(args: { where: unknown; data: unknown }): Promise<{ count: number }>;
  deleteMany(args: { where: unknown }): Promise<{ count: number }>;
};

const toPrismaWhere = (where: QueryOptions['where']): unknown => {
  if (!where) return undefined;
  if (Array.isArray(where)) return { OR: where.map(toPrismaWhere) };

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(where)) {
    if (key === 'OR' && Array.isArray(value)) {
      result.OR = value.map(item => toPrismaWhere(item as Record<string, unknown>));
      continue;
    }
    if (value && typeof value === 'object' && '__contains' in value) {
      result[key] = { contains: (value as { __contains: string }).__contains, mode: 'insensitive' };
    } else if (value && typeof value === 'object' && '__in' in value) {
      result[key] = { in: (value as { __in: unknown[] }).__in };
    } else if (value && typeof value === 'object' && '__has' in value) {
      result[key] = { has: (value as { __has: unknown }).__has };
    } else if (value && typeof value === 'object' && ('__gt' in value || '__lt' in value || '__gte' in value || '__lte' in value)) {
      const range = value as { __gt?: unknown; __lt?: unknown; __gte?: unknown; __lte?: unknown };
      result[key] = {
        ...(range.__gt !== undefined ? { gt: range.__gt } : {}),
        ...(range.__lt !== undefined ? { lt: range.__lt } : {}),
        ...(range.__gte !== undefined ? { gte: range.__gte } : {}),
        ...(range.__lte !== undefined ? { lte: range.__lte } : {}),
      };
    } else {
      result[key] = value;
    }
  }
  return result;
};

const toPrismaOrder = (order: QueryOptions['order']): unknown => {
  if (!order) return undefined;
  return Object.entries(order).map(([field, direction]) => ({
    [field]: direction.toLowerCase(),
  }));
};

class PrismaRepository<T extends { id: string }> {
  public constructor(private readonly delegate: PrismaDelegate<T>) {}

  public create(data: Partial<T>): T {
    return { ...data } as T;
  }

  public async save(entity: T): Promise<T>;
  public async save(entity: T[]): Promise<T[]>;
  public async save(entity: T | T[]): Promise<T | T[]> {
    if (Array.isArray(entity)) {
      await this.delegate.createMany({ data: entity });
      return entity;
    }

    const created = await this.delegate.create({ data: entity });
    Object.assign(entity, created);
    return entity;
  }

  public async findOne(options: QueryOptions): Promise<T | null> {
    return this.delegate.findFirst({
      where: toPrismaWhere(options.where),
      orderBy: toPrismaOrder(options.order),
    });
  }

  public async find(options: QueryOptions = {}): Promise<T[]> {
    return this.delegate.findMany({
      where: toPrismaWhere(options.where),
      orderBy: toPrismaOrder(options.order),
      take: options.take,
      skip: options.skip,
    });
  }

  public async findAndCount(options: QueryOptions = {}): Promise<[T[], number]> {
    const where = toPrismaWhere(options.where);
    const [items, count] = await Promise.all([
      this.delegate.findMany({
        where,
        orderBy: toPrismaOrder(options.order),
        take: options.take,
        skip: options.skip,
      }),
      this.delegate.count({ where }),
    ]);
    return [items, count];
  }

  public async update(criteria: string | Record<string, unknown>, data: Partial<T>): Promise<void> {
    await this.delegate.updateMany({
      where: typeof criteria === 'string' ? { id: criteria } : toPrismaWhere(criteria),
      data,
    });
  }

  public async delete(criteria: string | Record<string, unknown>): Promise<void> {
    await this.delegate.deleteMany({
      where: typeof criteria === 'string' ? { id: criteria } : toPrismaWhere(criteria),
    });
  }
}

export type { User, OAuthAccount, Session, PasswordResetToken, EmailVerificationToken, Shop, VendorStory, WishlistItem, SizeChart, SellerEarnings, Payout, Product, Inventory, ProductVariation, Order, OrderItem, ReturnRequest, Payment, Notification, Review, Message, ContentPage, Asset, Coupon } from './database.types';

export const contains = (value: string): { __contains: string } => ({ __contains: value });
export const greaterThan = (value: Date | number): { __gt: Date | number } => ({ __gt: value });
export const lessThan = (value: Date | number): { __lt: Date | number } => ({ __lt: value });
export const greaterThanOrEqual = (value: Date | number): { __gte: Date | number } => ({ __gte: value });
export const lessThanOrEqual = (value: Date | number): { __lte: Date | number } => ({ __lte: value });
export const inList = (values: unknown[]): { __in: unknown[] } => ({ __in: values });
export const hasItem = (value: unknown): { __has: unknown } => ({ __has: value });

export const getUserRepository = () => new PrismaRepository<User>(prisma.users as unknown as PrismaDelegate<User>);
export const getOAuthAccountRepository = () => new PrismaRepository<OAuthAccount>(prisma.oauth_accounts as unknown as PrismaDelegate<OAuthAccount>);
export const getSessionRepository = () => new PrismaRepository<Session>(prisma.sessions as unknown as PrismaDelegate<Session>);
export const getPasswordResetTokenRepository = () => new PrismaRepository<PasswordResetToken>(prisma.password_reset_tokens as unknown as PrismaDelegate<PasswordResetToken>);
export const getEmailVerificationTokenRepository = () => new PrismaRepository<EmailVerificationToken>(prisma.email_verification_tokens as unknown as PrismaDelegate<EmailVerificationToken>);
export const getShopRepository = () => new PrismaRepository<Shop>(prisma.shops as unknown as PrismaDelegate<Shop>);
export const getVendorStoryRepository = () => new PrismaRepository<VendorStory>(prisma.vendor_stories as unknown as PrismaDelegate<VendorStory>);
export const getWishlistRepository = () => new PrismaRepository<WishlistItem>(prisma.wishlist_items as unknown as PrismaDelegate<WishlistItem>);
export const getSizeChartRepository = () => new PrismaRepository<SizeChart>(prisma.size_charts as unknown as PrismaDelegate<SizeChart>);
export const getSellerEarningsRepository = () => new PrismaRepository<SellerEarnings>(prisma.seller_earnings as unknown as PrismaDelegate<SellerEarnings>);
export const getPayoutRepository = () => new PrismaRepository<Payout>(prisma.payouts as unknown as PrismaDelegate<Payout>);
export const getProductRepository = () => new PrismaRepository<Product>(prisma.products as unknown as PrismaDelegate<Product>);
export const getInventoryRepository = () => new PrismaRepository<Inventory>(prisma.inventory as unknown as PrismaDelegate<Inventory>);
export const getProductVariationRepository = () => new PrismaRepository<ProductVariation>(prisma.product_variations as unknown as PrismaDelegate<ProductVariation>);
export const getOrderRepository = () => new PrismaRepository<Order>(prisma.orders as unknown as PrismaDelegate<Order>);
export const getOrderItemRepository = () => new PrismaRepository<OrderItem>(prisma.order_items as unknown as PrismaDelegate<OrderItem>);
export const getReturnRequestRepository = () => new PrismaRepository<ReturnRequest>(prisma.return_requests as unknown as PrismaDelegate<ReturnRequest>);
export const getPaymentRepository = () => new PrismaRepository<Payment>(prisma.payments as unknown as PrismaDelegate<Payment>);
export const getNotificationRepository = () => new PrismaRepository<Notification>(prisma.notifications as unknown as PrismaDelegate<Notification>);
export const getReviewRepository = () => new PrismaRepository<Review>(prisma.reviews as unknown as PrismaDelegate<Review>);
export const getMessageRepository = () => new PrismaRepository<Message>(prisma.messages as unknown as PrismaDelegate<Message>);
export const getAssetRepository = () => new PrismaRepository<Asset>(prisma.assets as unknown as PrismaDelegate<Asset>);
export const getCouponRepository = () => new PrismaRepository<Coupon>(prisma.coupons as unknown as PrismaDelegate<Coupon>);
export const getContentPageRepository = () => new PrismaRepository<ContentPage>(prisma.content_pages as unknown as PrismaDelegate<ContentPage>);

export async function initDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export const getPool = () => ({
  query: async (sql: string, parameters: unknown[]): Promise<Array<Record<string, string>>> =>
    prisma.$queryRawUnsafe<Array<Record<string, string>>>(sql, ...parameters),
});
