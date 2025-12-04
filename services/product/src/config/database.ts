import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createLogger } from '@crevea/shared';
import { Product } from '@crevea/shared';

const logger = createLogger('database');

// Inventory and Variation entities (simplified for now)
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  productId!: string;

  @Column({ nullable: true })
  variationId?: string;

  @Column({ default: 0 })
  stock!: number;

  @Column({ default: 0 })
  reserved!: number;

  @Column({ default: 0 })
  available!: number;

  @Column({ default: 10 })
  lowStockThreshold!: number;

  @Column({ nullable: true })
  restockDate?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

@Entity('product_variations')
export class ProductVariation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  productId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  sku?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceAdjustment!: number;

  @Column({ default: 0 })
  stock!: number;

  @Column({ type: 'text', array: true, default: '{}' })
  images!: string[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
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
