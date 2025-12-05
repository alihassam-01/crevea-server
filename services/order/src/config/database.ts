import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createLogger } from '@crevea/shared';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { OrderStatus } from '@crevea/shared';

const logger = createLogger('database');

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  orderNumber!: string;

  @Column({ type: 'varchar' })
  @Index()
  customerId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @Column({
    type: 'varchar',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @Index()
  status!: OrderStatus;

  @Column({ type: 'jsonb' })
  shippingAddress!: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  trackingNumber?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  orderId!: string;

  @Column({ type: 'varchar' })
  @Index()
  productId!: string;

  @Column({ type: 'varchar' })
  @Index()
  shopId!: string;

  @Column({ type: 'varchar' })
  productName!: string;

  @Column({ type: 'varchar', nullable: true })
  productImage?: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @Column({ type: 'jsonb', nullable: true })
  variation?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('return_requests')
export class ReturnRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  @Index()
  orderId!: string;

  @Column({ type: 'varchar' })
  @Index()
  customerId!: string;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  images!: string[];

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
  entities: [Order, OrderItem, ReturnRequest],
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

export const getOrderRepository = () => AppDataSource.getRepository(Order);
export const getOrderItemRepository = () => AppDataSource.getRepository(OrderItem);
export const getReturnRequestRepository = () => AppDataSource.getRepository(ReturnRequest);
