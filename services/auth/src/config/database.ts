import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createLogger } from '@crevea/shared';
import { User, OAuthAccount, Session, PasswordResetToken, EmailVerificationToken } from '@crevea/shared';

const logger = createLogger('database');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development', // Auto-create tables in dev
  logging: process.env.NODE_ENV === 'development',
  entities: [User, OAuthAccount, Session, PasswordResetToken, EmailVerificationToken],
  subscribers: [],
  migrations: [],
  maxQueryExecutionTime: 1000, // Log slow queries
  poolSize: 20,
});

export const initDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected with TypeORM');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
};

// Export repositories for easy access
export const getUserRepository = () => AppDataSource.getRepository(User);
export const getOAuthAccountRepository = () => AppDataSource.getRepository(OAuthAccount);
export const getSessionRepository = () => AppDataSource.getRepository(Session);
export const getPasswordResetTokenRepository = () => AppDataSource.getRepository(PasswordResetToken);
export const getEmailVerificationTokenRepository = () => AppDataSource.getRepository(EmailVerificationToken);
