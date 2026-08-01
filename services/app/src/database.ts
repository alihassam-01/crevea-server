import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createLogger, Review } from '@crevea/shared';
import { User, OAuthAccount, Session, PasswordResetToken, EmailVerificationToken } from './modules/auth/entities';
import { Shop, SizeChart, SellerEarnings, Payout } from './modules/shop/entities';
import { Product, Inventory, ProductVariation } from './modules/product/entities';
import { Order, OrderItem, ReturnRequest } from './modules/order/entities';
import { Payment } from './modules/payment/entities';
import { Notification } from './modules/notification/entities';

export { User, OAuthAccount, Session, PasswordResetToken, EmailVerificationToken } from './modules/auth/entities';
export { Shop, SizeChart, SellerEarnings, Payout } from './modules/shop/entities';
export { Product, Inventory, ProductVariation } from './modules/product/entities';
export { Order, OrderItem, ReturnRequest } from './modules/order/entities';
export { Payment } from './modules/payment/entities';

const logger = createLogger('database');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User, OAuthAccount, Session, PasswordResetToken, EmailVerificationToken,
    Shop, SizeChart, SellerEarnings, Payout,
    Product, Inventory, ProductVariation,
    Order, OrderItem, ReturnRequest,
    Payment, Notification, Review,
  ],
  subscribers: [],
  migrations: [],
  maxQueryExecutionTime: 1000,
  poolSize: 20,
});

export async function initDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) return;
  try {
    await AppDataSource.initialize();
  } catch (error) {
    logger.error({ err: error }, 'Database connection failed');
    throw error;
  }
  logger.info('Database connected');
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
}

export const getUserRepository = () => AppDataSource.getRepository(User);
export const getOAuthAccountRepository = () => AppDataSource.getRepository(OAuthAccount);
export const getSessionRepository = () => AppDataSource.getRepository(Session);
export const getPasswordResetTokenRepository = () => AppDataSource.getRepository(PasswordResetToken);
export const getEmailVerificationTokenRepository = () => AppDataSource.getRepository(EmailVerificationToken);
export const getShopRepository = () => AppDataSource.getRepository(Shop);
export const getSizeChartRepository = () => AppDataSource.getRepository(SizeChart);
export const getSellerEarningsRepository = () => AppDataSource.getRepository(SellerEarnings);
export const getPayoutRepository = () => AppDataSource.getRepository(Payout);
export const getProductRepository = () => AppDataSource.getRepository(Product);
export const getInventoryRepository = () => AppDataSource.getRepository(Inventory);
export const getProductVariationRepository = () => AppDataSource.getRepository(ProductVariation);
export const getOrderRepository = () => AppDataSource.getRepository(Order);
export const getOrderItemRepository = () => AppDataSource.getRepository(OrderItem);
export const getReturnRequestRepository = () => AppDataSource.getRepository(ReturnRequest);
export const getPaymentRepository = () => AppDataSource.getRepository(Payment);
export const getNotificationRepository = () => AppDataSource.getRepository(Notification);
export const getReviewRepository = () => AppDataSource.getRepository(Review);
export const getPool = () => AppDataSource.manager;
