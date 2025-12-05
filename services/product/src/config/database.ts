import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createLogger } from '@crevea/shared';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ProductStatus, ProductType } from '@crevea/shared';

const logger = createLogger('database');

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  shopId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  shortDescription?: string;

  @Column({
    type: 'varchar',
    enum: ProductType,
    default: ProductType.PHYSICAL,
  })
  type!: ProductType;

  @Column({
    type: 'varchar',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @Index()
  status!: ProductStatus;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  category!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags!: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  images!: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice?: number;

  @Column({ type: 'varchar', length: 3, default: 'ZAR' })
  currency!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string;

  @Column({ type: 'int', nullable: true })
  weight?: number;

  @Column({ type: 'jsonb', nullable: true })
  dimensions?: Record<string, any>;

  @Column({ type: 'jsonb' })
  attributes!: Record<string, any>;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ type: 'int', default: 0 })
  totalReviews!: number;

  @Column({ type: 'int', default: 0 })
  totalSales!: number;

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  productId!: string;

  @Column({ type: 'varchar', nullable: true })
  variationId?: string;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ type: 'int', default: 0 })
  reserved!: number;

  @Column({ type: 'int', default: 0 })
  available!: number;

  @Column({ type: 'int', default: 10 })
  lowStockThreshold!: number;

  @Column({ type: 'timestamp', nullable: true })
  restockDate?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

@Entity('product_variations')
export class ProductVariation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  productId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  sku?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceAdjustment!: number;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ type: 'text', array: true, default: '{}' })
  images!: string[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.PRODUCT_DATABASE_URL || process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Product, Inventory, ProductVariation],
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

export const getProductRepository = () => AppDataSource.getRepository(Product);
export const getInventoryRepository = () => AppDataSource.getRepository(Inventory);
export const getProductVariationRepository = () => AppDataSource.getRepository(ProductVariation);
