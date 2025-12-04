import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createLogger } from '@crevea/shared';
import { Review } from '@crevea/shared';

const logger = createLogger('database');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Review],
  subscribers: [],
  migrations: [],
  maxQueryExecutionTime: 1000,
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

export const getReviewRepository = () => AppDataSource.getRepository(Review);
