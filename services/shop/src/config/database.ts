import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createLogger } from '@crevea/shared';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ShopCategory, ShopStatus, VerificationStatus } from '@crevea/shared';

const logger = createLogger('database');

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  slug!: string;

  @Column()
  @Index()
  sellerId!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  banner?: string;

  @Column({
    type: 'varchar',
    enum: ShopCategory,
  })
  @Index()
  category!: ShopCategory;

  @Column({
    type: 'varchar',
    enum: ShopStatus,
    default: ShopStatus.ACTIVE,
  })
  @Index()
  status!: ShopStatus;

  @Column({
    type: 'varchar',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  @Index()
  verificationStatus!: VerificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  address?: Record<string, any>;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks?: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  commissionRate!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ default: 0 })
  totalReviews!: number;

  @Column({ default: 0 })
  totalSales!: number;

  @Column({ type: 'jsonb', nullable: true })
  verificationDocuments?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Shop],
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

export const getShopRepository = () => AppDataSource.getRepository(Shop);

export const getPool = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized');
  }
  // Return the DataSource manager which has query method
  return AppDataSource.manager;
};


